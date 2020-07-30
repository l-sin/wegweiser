import json
import requests
import time
import datetime
from timeit import default_timer as timer
import matplotlib.pyplot as plt
import numpy as np
import re
from functools import reduce
from itertools import cycle

requests_count = 0

def multiget_journey(node,date):
    
    global requests_count
    
    multi_origin_string = str(reduce(str.__add__, ('from[{}]={}&'.format(i,hub) for i,hub in enumerate(hubs))))
    url = str( 'https://timetable.search.ch/api/route.json?'+
               multi_origin_string+
               'to={}&'.format(node)+
               'one_to_many=1&'+
               'time_type=arrival&'+
               'date={}&'.format(date)+
               'time=10:30' )
    hubs_to_node = requests.get(url).json()
    
    multi_destination_string = str(reduce(str.__add__, ('to[{}]={}&'.format(i,hub) for i,hub in enumerate(hubs))))
    url = str( 'https://timetable.search.ch/api/route.json?'+
               'from={}&'.format(node)+
               multi_destination_string+
               'one_to_many=1'+
               'time_type=depart&'+
               'date={}&'.format(date)+
               'time=16:30' )
    node_to_hubs = requests.get(url).json()
    
    requests_count+=2
    
    return hubs_to_node,node_to_hubs

def parse_journey(journey):
    routes=[]
    for route in journey['connections']:
        r = {'duration': route['duration'] if 'duration' in route else 300,
             'legs': [ [route['legs'][k]['name'], 
                        route['legs'][k]['type_name'], 
                        route['legs'][k]['exit']['name']] for k in range(len(route['legs'])-1) ]}
        routes.append(r)
    return routes

def next_saturday():
    """
    returns the date of the coming Saturday in mm/dd/yyyy
    """
    now = time.localtime()
    days_til_saturday = 5-now.tm_wday
    next_saturday_ = datetime.date(now.tm_year, now.tm_mon, now.tm_mday) + datetime.timedelta(days=days_til_saturday)
    
    datestring = '{0:02d}/{1:02d}/{2:}'.format(next_saturday_.month,next_saturday_.day,next_saturday_.year)
    return datestring

def iter_nodes(nodes,last_updated_node):
    """
    iterates over nodes starting off at last_updated_node, and then looping back once
    """
    nodes = list(nodes.keys())
    continue_index = nodes.index(last_updated_node)+1
    for node in nodes[continue_index:]+nodes[:continue_index]:
        yield node

with open('config.txt', 'r') as infile:
    config = json.load(infile)

fname = 'SM'
with open('../data/{}_raw_nodes.txt'.format(fname), 'r') as infile:
    nodes = json.load(infile)
    
avoid = config["wrong"]+config["missing"] #see below on how to construct wrong and missing

hubs = config["hubs"]

last_updated_node = config['last_updated_node']

#initialization
#journies=dict()
#for node in nodes:
#    journies[node] = {hub:{'go':None,'go_time':None,'back':None,'back_time':None} for hub in hubs}
#    
#with open('../data/{}_with_travel.txt'.format(fname), 'w') as outfile:
#    json.dump(journies,outfile)

with open('../data/{}_with_travel.txt'.format(fname), 'r') as infile:
    journies=json.load(infile)

#test
#hubs_to_node,node_to_hubs = multiget_journey("Sargans", next_saturday())

target_date = next_saturday() #MM/DD/YYYY

for node in iter_nodes(nodes,last_updated_node=last_updated_node):
    if node in avoid:
        continue
    
    try:
        hubs_to_node,node_to_hubs = multiget_journey(node=re.sub('\((.*)\)',r'\1',node),
                                                     date=next_saturday())
        if 'results' not in hubs_to_node or 'results' not in node_to_hubs:
            continue
        for i,hub in enumerate(hubs):
            if 'connections' in hubs_to_node['results'][i]:
                routes = parse_journey(hubs_to_node['results'][i])

                journies[node][hub]['go'] = routes
                journies[node][hub]['go_time'] = np.mean([route['duration'] for route in routes])
                # 'routes' contains four routes, sampled at a typical time at which I would set out

            if 'connections' in node_to_hubs['results'][i]:
                routes = parse_journey(node_to_hubs['results'][i])

                journies[node][hub]['back'] = routes
                journies[node][hub]['back_time'] = np.mean([route['duration'] for route in routes])

        config['last_updated_node'] = node
        
        if requests_count%100==0:
            print('{}% done'.format(100*requests_count/1000))

        if requests_count>980:
            print('Exceeding allowed number of API calls to timetable.search.ch, exiting')
            break   
    except KeyboardInterrupt:
        raise
    except:
        print('Unexpected error occurred while working on {}, skipping'.format(node))
        continue

with open('config.txt', 'w') as outfile:
    json.dump(config,outfile)

with open('../data/{}_with_travel.txt'.format(fname), 'w') as outfile:
    json.dump(journies,outfile)