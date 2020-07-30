import json
import requests
import time
from timeit import default_timer as timer
import numpy as np

with open('config.txt', 'r') as infile:
    config = json.load(infile)

    
APIKEY=config["openweathermap_APIKEY"]
region_names=config["region_names"]
outliers=config["outliers"]

date = time.strftime('%Y_%m_%d')

def get_weather(query):
    APIKEY  = 'ba5903b1b3e78ee35a0b2c29a50618fe'
    weather = requests.get(
                            'http://api.openweathermap.org/data/2.5/forecast?'+
                             query+
                            '&mode=json&APPID='+APIKEY
                            ).json() #3-hourly forecast for the next 5 days
    return weather

def generate_query(node):
    if node['coords']!=[]:
        [lat,lon] =node['coords'][0].split(',')
        query = 'lat='+lat + '&lon='+lon
    else:
        query = 'q='+ node['name'] +',CH'
        
    return query

def get_neighbours(node):
    neighbours = []
    for edge in node['edges']:
        if node['name']==edges[edge]['start']:
            if edges[edge]['end'] in nodes and edges[edge]['start'] != edges[edge]['end']:
                neighbours.append(edges[edge]['end'])
        elif node['name']==edges[edge]['end']:
            if edges[edge]['start'] in nodes and edges[edge]['start'] != edges[edge]['end']:
                neighbours.append(edges[edge]['start'])
        else:
            raise Exception('Neigbhour could not be identified')
        
    return neighbours

def parse_time(timestring):
    if 'h' in timestring:
        t = int(timestring.split('h')[0])*3600
        if 'm' in timestring:
            t += int(timestring.split('h')[1].strip('m'))*60
    else:
        t = int(timestring.strip('m'))*60
    
    return t #in seconds

for fname in region_names:
    
    with open('../data/{}_raw_nodes.txt'.format(fname), 'r') as infile:
        nodes = json.load(infile)

    with open('../data/{}_raw_edges.txt'.format(fname), 'r') as infile:
        edges = json.load(infile)

    for node in nodes:
        start = timer()
        query = generate_query(nodes[node])
        nodes[node]['weather'] = get_weather(query)

        t = timer()-start
        if t < 1:
            time.sleep(1-t)

    for node in nodes:
        if nodes[node]['weather']['cod'][0]=='4':
            nodes[node]['flag'] = 'Name not found in owAPI'
        elif node in outliers[fname]:
            nodes[node]['flag'] = 'owAPI returned wrong place for this name'

    for node in nodes:
        if 'flag' in nodes[node]:
            neighbours = [ (parse_time(edges[e]['duration']), n) 
                              for n,e in zip(get_neighbours(nodes[node]), nodes[node]['edges']) if 'flag' not in nodes[n] ]

            if neighbours != []:
                nodes[node]['weather'] = nodes[min(neighbours)[1]]['weather']
                #since the weather doesn't vary much on small scales, this hack is ok
                #at times, this is what openweathermap does anyway even if I provide the exact coords
            else:
                continue


    weather = { node:{'weather':nodes[node]['weather']} for node in nodes }
    for node in weather:
        if 'flag' in nodes[node]:
            weather[node]['flag'] = nodes[node]['flag']

    with open('../data/{}_weather_{}.txt'.format(fname,date), 'w') as outfile:
         json.dump(weather,outfile)
            
config['weather_update'] = date
            
with open('config.txt', 'w') as outfile:
    json.dump(config,outfile)
           
