#!/usr/bin/env python3
"""Serve the games on the local network for testing on tablets.

Like `python3 -m http.server`, but tells browsers never to cache anything, so a
normal reload on the iPad always shows the latest version of the files.

Usage:  python3 serve.py [port]      (default port: 8000)
Then open the address it prints on the tablet (same Wi-Fi as this computer).
"""
import functools
import http.server
import os
import socket
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_head(self):
        # Ignore If-Modified-Since so the browser never gets a "304 Not Modified"
        # pointing at an old copy it kept from before.
        del self.headers["If-Modified-Since"]
        return super().send_head()


def local_ip():
    """This computer's address on the local network (no traffic is sent)."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("192.0.2.1", 80))  # reserved test address, never contacted
            return s.getsockname()[0]
    except OSError:
        return "localhost"


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    root = os.path.dirname(os.path.abspath(__file__))
    handler = functools.partial(NoCacheHandler, directory=root)
    with http.server.ThreadingHTTPServer(("0.0.0.0", port), handler) as server:
        print(f"Serving {root} with caching turned off", flush=True)
        print(f"  on this computer: http://localhost:{port}/")
        print(f"  on the tablet:    http://{local_ip()}:{port}/")
        print("Press Ctrl+C to stop.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
