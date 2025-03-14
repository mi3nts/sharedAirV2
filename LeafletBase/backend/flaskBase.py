from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable cross-origin requests for frontend

@app.route('/standard', methods=['GET'])
def get_standard():
    config = {
        'center': [37.7749, -122.4194],
        'zoom': 12
    }
    return jsonify(config)

if __name__ == '__main__':
    app.run(debug=True, port=5000)