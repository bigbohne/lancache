# Lancache Improved

## Overview
This project is an improved version of the original Lancache project. It enhances the functionality by reusing HTTP connections to the backend, which helps in avoiding blocks by the CDN.

## Features
- Reuses HTTP connections to optimize performance.
- Stores cache on disk with maximum size and LRU eviction

## Installation
To install the project, clone the repository and run the following command:

```bash
bun install
```

## Usage
To start the server, run:

```bash
bun run dev
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## License
This project is open source