import json
import numpy as np
import re



def Strip(comp,string):
    return re.sub(comp, '', string)

def input_node(nodes,row,fmt,create=True):
    name = row[0]
    fields = ['elevation', 'coords', 'transport', 'enjoyment', 'edges']
    
    if ',' in name:
        # dealing with compound (i.e. comma'd) connections:
        #     just don't input them
        return
    
    if name not in nodes:
        if create==True:
            nodes[name]={field:[] for field in fields}
            nodes[name]['name']=name
        else:
            return
        
    for i,f in enumerate(fmt):
        if f in fields:
            if row[i] not in nodes[name][f]:
                nodes[name][f].append(row[i])

                
with open('data/data backup/all_trails.txt', 'r') as infile:
    trails=json.load(infile)
fname = 'SM'

nodes = dict()
edges = dict()

for i,edge in enumerate(trails):
    trail_points = edge['trail_points'].split('–')
    start = Strip(r'Stage \d+ ',trail_points[0])
    end = trail_points[1]
    
    try:
        if edge['grade_fitness'].split('(')[1][0] == 'h':
            routeType = 'Hiking'
        elif edge['grade_fitness'].split('(')[1][0] == 'm':
            routeType = 'Mountain'
        else:
            continue
    except IndexError:
        continue
    
    edges.update({'{}{}'.format(fname,i):{
                                            'start':start,
                                            'end':end,
                                            'duration':edge['time'].strip('in')
                                                                   .replace(' h ','h')
                                                                   .replace(' m','m'),
                                            'type':routeType,
                                            #'description':edge['description']
                                            'url':edge['url']
                                            }})

for k,v in edges.items():
    input_node( 
               nodes,
               [ v['start'], k ],
               fmt=['name','edges'],
               create=True
                )
    
    input_node(
               nodes,
               [ v['end'], k ],
               fmt=['name','edges'],
               create=True
                )

with open('data/{}_raw_edges.txt'.format(fname), 'w') as outfile:
    json.dump(edges, outfile)
    
with open('data/{}_raw_nodes.txt'.format(fname), 'w') as outfile:
    json.dump(nodes, outfile)