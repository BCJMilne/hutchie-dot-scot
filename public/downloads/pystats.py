import platform
import subprocess
from datetime import datetime
import threading
import time
import json
import sys
import os

print("\nChecking system...")
plat = platform.system()
print("Detected platform: " + plat)

try:
    import curses
    from curses import wrapper
    import requests
    import jwt
except Exception as e:
    print("Exception: ", e)
    sys.exit(1)

api_url = "https://api.hutchie.scot/api/"

print("Creating token...")
timestamp = int(time.time())
print("Timestamp will be: ", timestamp)

token = {
    'iss': 'hutch-status',
    'aud': 'https://api.hutchie.scot/api/',
    'iat': timestamp,
}

pem = open('key.pem').read()

encoded_token = jwt.encode(token, pem, algorithm='RS256')

# print("Token created: ", encoded_token)

print("Sending test request...")
headers = {'Authorization': encoded_token}
r = requests.get(api_url, headers=headers)
print("Response: ", r.text)
if(r.text != "Unauthorized"):
    print("Token accepted")
else:
    print("Token refused")
    exit(2)

def get_status(query):
    headers = {'Authorization': encoded_token}
    r = requests.get(api_url+(query), headers=headers)
    j = json.loads(r.text)
    return j

print("Starting curses...")

# [{"hostname":"bigpasta",
#   "temperature":"58",
#   "load":"0.01",
#   "uptime":"1640783",
#   "cpus":"8",
#   "timestamp":"1566771692542"},
#  {"hostname":"hutch",
#   "temperature":"53.692",
#   "load":"0",
#   "uptime":"1121157",
#   "cpus":"4",
#   "timestamp":"1566771687477"}]
# [{"room":"server_room",
#   "temperature":{
#       "28ff2a97c417051a":"20.25"}}]

def main(stdscr):

    # Clear screen
    stdscr.clear()
    curses.curs_set(0)

    def refresh_scr(stdscr, stop_event):
        main_win = curses.newwin(curses.LINES-2, curses.COLS, 1, 0)

        inner_win = curses.newpad(100, 40)
        # (curses.LINES-6, curses.COLS-2, 2, 2)

        while not stop_event.is_set():
            main_win.clear()
            main_win.erase()
            main_win.box()
            inner_win.clear()
            servers     = get_status("servers")
            rooms       = get_status("rooms")

            now = datetime.now()
            inner_win.addstr(0, 1, ("Last Updated: " + now.strftime("%m/%d/%Y, %H:%M:%S")))

            server_lines = 2    # Because we start at line 1
            inner_win.addstr(server_lines, 1, "Servers", curses.A_REVERSE)
            server_lines += 1
            for server in servers:
                inner_win.addstr(server_lines, 3, server["hostname"])
                server_lines += 1
                for key, value in server.items():
                    if isinstance(value, (dict)):
                        for value_key, value_value in value.items(): 
                            inner_win.addstr(server_lines, 5, (value_key + ": " + str(value_value)))
                            server_lines += 1
                    else:
                        inner_win.addstr(server_lines, 5, (key + ": " + value))
                        server_lines += 1

            room_lines = server_lines + 1

            inner_win.addstr(room_lines, 1, "Rooms", curses.A_REVERSE)
            room_lines += 1
            for room in rooms:
                inner_win.addstr(room_lines, 3, room["room"])
                for key, value in room.items():
                    if isinstance(value, (dict)):
                        # inner_win.addstr(room_lines, 5, (key + ": "))
                        # room_lines += 1
                        for value_key, value_value in value.items(): 
                            inner_win.addstr(room_lines, 7, (value_key + ": " + str(value_value)))
                            room_lines += 1
                    else:
                        inner_win.addstr(room_lines, 5, (key + ": " + value))
                        room_lines += 1

            stdscr.noutrefresh()
            main_win.noutrefresh()
            inner_win.noutrefresh(0, 0, 3, 3, curses.LINES-6, curses.COLS-2)
            curses.doupdate()
            time.sleep(15)

    # curses.init_pair(1, curses.COLOR_WHITE, curses.COLOR_BLACK)

    def draw_frame():
        stdscr.move(0, 0)
        stdscr.clear()
        stdscr.addstr(" HUTCHIE.SCOT", curses.A_REVERSE)
        stdscr.chgat(-1, curses.A_REVERSE)
        stdscr.addstr(curses.LINES-1, 0, "Press 'Q' to quit")
        stdscr.noutrefresh()
        curses.doupdate()

    stop_event = threading.Event()
    refresh_timer = threading.Thread(target=refresh_scr, args=(stdscr, stop_event))
    refresh_timer.isDaemon()
    refresh_timer.start()

    draw_frame()

    while True:
        c = stdscr.getch()
        curses.flushinp()
        if c == ord('q'):
            stop_event.set()
            sys.exit(0)
        elif c == curses.KEY_RESIZE:
            y, x = stdscr.getmaxyx()
            curses.update_lines_cols()
            # curses.resizeterm(y, x)
            draw_frame()

    stop_event.set()

wrapper(main)

print("Exiting!")
sys.exit(0)
