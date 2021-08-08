::@echo off
cmd /k "call C:\Users\Larry\Documents\GitHub\wegweiser\env\Scripts\activate & cd /d  C:\Users\Larry\Documents\GitHub\wegweiser\beta\update_database\ & python update_weather.py && python upload_routes.py"
pause
