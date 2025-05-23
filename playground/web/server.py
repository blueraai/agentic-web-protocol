import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import unquote, urlparse


class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Set CORS headers
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        return super().end_headers()

    def guess_type(self, path):
        if path.endswith(".js"):
            return "application/javascript"
        if path.endswith(".mjs"):
            return "application/javascript"
        if path.endswith(".ts"):
            return "application/javascript"
        return super().guess_type(path)

    def do_GET(self):  # noqa: N802
        # Parse the URL
        parsed_path = urlparse(self.path)
        path = unquote(parsed_path.path)

        # Handle node_modules imports
        if path.startswith("/node_modules/"):
            self.path = path[1:]  # Remove leading slash
        # Handle requests for the playground
        elif path.startswith("/playground/web/"):
            self.path = path[1:]  # Remove leading slash
        # Handle requests for distweb
        elif path.startswith("/distweb/"):
            self.path = path[1:]  # Remove leading slash

        return super().do_GET()


if __name__ == "__main__":
    # Get the absolute path to the project root
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    os.chdir(root_dir)

    # Create server
    server_address = ("", 8000)
    httpd = HTTPServer(server_address, CustomHandler)
    print("Serving on http://localhost:8000")
    print("Project root:", root_dir)
    print("Access playground at: http://localhost:8000/playground/web/")
    httpd.serve_forever()
