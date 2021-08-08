def update():
    import update_travel
    import update_weather
    #import upload_routes
    
try:
    update()
except KeyError:
    try:
        update()
    except KeyError:
        print("Warning, update failed.")
        pass
