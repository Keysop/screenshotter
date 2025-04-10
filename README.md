# Website Screenshot Service

A simple Node.js service that takes screenshots of websites using Puppeteer.

## Features

- Takes screenshots of any website
- Configurable timeout before taking the screenshot (default: 10 seconds)
- Returns the screenshot as a base64 encoded image
- Simple REST API endpoint
- Configurable port through environment variables

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Configuration

The service can be configured using environment variables:

- `PORT`: The port number the server will listen on (default: 3000)

You can set these variables in a `.env` file in the root directory:

```env
PORT=3000
```

## Usage

1. Start the server:

```bash
node index.js
```

2. Make a request to take a screenshot:

```
POST http://localhost:3000/screenshot
Content-Type: application/json

{
    "url": "https://example.com",
    "timeout": 5000  // Optional, defaults to 10000 (10 seconds)
}
```

The service will return a JSON response with:

- `image`: Base64 encoded PNG image
- `timestamp`: When the screenshot was taken
- `timeout`: The timeout value used (in milliseconds)

## Example Response

```json
{
  "image": "data:image/png;base64,...",
  "timestamp": "2024-03-21T12:34:56.789Z",
  "timeout": 10000
}
```

## Error Handling

The service will return appropriate error messages if:

- URL parameter is missing
- Failed to take screenshot
- Invalid URL
