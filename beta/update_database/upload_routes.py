import json
import numpy as np
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

def parse_time(timestring):
    if 'h' in timestring:
        t = int(timestring.split('h')[0])
        if 'm' in timestring:
            t += int(timestring.split('h')[1].strip('m'))/60
    else:
        t = int(timestring.strip('m'))/60
    
    return t #in hrs

class Node:
    def __init__(self,name):
        self.name = name
        
        try:
            self.weather = {fc['dt_txt']:{'status':fc['weather'][0]['main'],
                                          'temperature':int(fc['main']['temp']-273) }
                            for fc in weather[self.name]['weather']['list'] if '12:00:00' in fc['dt_txt']}
        except:
            self.weather = None
            
        try:
            self.coords = { 'E':coords[self.name]['E'], 'N':coords[self.name]['N']  }
        except:
            self.coords = None

            
        # this can be relaxed a bit in principle
        try:
            self.travel = { hub:{'go_time':journies[self.name][hub]['go_time'],
                                 'back_time':journies[self.name][hub]['back_time']} for hub in hubs }
        except:
            self.travel = None     
            
    def is_clean(self):
        clean = (
                     self.weather is not None and 
                     self.coords is not None and 
                     self.travel is not None and
                     any( (journies[self.name][hub]['go'] is None or 
                           journies[self.name][hub]['back'] is None) for hub in hubs) == False
        )
        return clean

class Edge:
    def __init__(self,edge):
        self.start = Node(edge['start'])
        self.end = Node(edge['end'])
        self.type_ = edge['type']
        self.duration = parse_time(edge['duration'])
        self.url = edge['url']

    def is_clean(self):
        return (self.start.is_clean() and self.end.is_clean())
    
    def mean_coords(self):
        return {'E':np.mean([self.start.coords['E'],self.end.coords['E']]),
                'N':np.mean([self.start.coords['N'],self.end.coords['N']])}
    
    def travel_info(self):
        """
        returns a 'flat' dictionary with travel times to and from all hubs, in seconds
        """
        travel_to_start = {'time_to_start_from_{}'.format(hub):self.start.travel[hub]['go_time'] for hub in hubs}
        travel_from_end = {'time_to_{}_from_end'.format(hub):self.end.travel[hub]['back_time'] for hub in hubs}
        
        travel_info_ = {**travel_to_start,**travel_from_end}
        
        return {journey_name:time_in_sec/3600 for journey_name,time_in_sec in travel_info_.items()}
        
    def db_format(self):
        
        output = {
                    'start': self.start.name,
                    'end': self.end.name,
                    'type': self.type_,
                    'start_weather': self.start.weather,
                    'end_weather': self.end.weather,
                    'duration': self.duration,
                    'coords': self.mean_coords(),
                    **self.travel_info(),
                    'url':self.url
        }
        
        return output

with open('config.txt', 'r') as infile:
    config = json.load(infile)

weather_update = config["weather_update"]

region_names = config["region_names"]
hubs = config["hubs"]

cred = credentials.Certificate(config["firebase_cred"])
try:
    firebase_admin.initialize_app(cred)
except ValueError:
    pass

routes={'Hiking':{},'Mountain':{},'Alpine':{}}
badcount = 0
for fname in region_names:

    # route-related information
    with open('../data/{}_raw_edges.txt'.format(fname), 'r') as infile:
        edges = json.load(infile)

    with open('../data/{}_weather_{}.txt'.format(fname,weather_update), 'r') as infile:
        weather = json.load(infile)

    with open('../data/{}_with_travel.txt'.format(fname), 'r') as infile:
        journies = json.load(infile)
        
    with open('../data/{}_coords.txt'.format(fname), 'r') as infile:
        coords = json.load(infile)

    for name,edge in edges.items():
        edge = Edge(edge)
        if edge.is_clean():
            routes[edge.type_][name] = edge.db_format()

duration_filters = {
    'less than 3': lambda kv: kv[1]['duration']<3,
    '3 to 6': lambda kv: 3<=kv[1]['duration']<6,
    'more than 6':lambda kv: 6<=kv[1]['duration']
}

db = firestore.client()
for route_type,route_subset in routes.items():
    for duration, duration_filter in duration_filters.items():
        subset = {kv[0]:kv[1] for kv in filter(duration_filter, routes[route_type].items())}
        db.collection('beta_'+route_type).document(duration).set(subset)
