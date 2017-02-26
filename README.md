# who-is-home

A simple nodejs server written on top of nmap and arp. 

# Dependencies
As the description states, this is a simple nodejs server written on top of nmap and arp. As such, it requires both nmap and arp to be installed on the system that this is running.

Also, for the moment, this requires `node>6.10`.

# Running it
Running the server with node:
```sh
node index.js
```

A few options can be specified using cli arguments. Below are the supported ones, and their default values. All arguments are optional.
```sh
node index.js interval=5000 ip_range=192.168.1.1/24 port=3000
```

| Argument   | Type    | Description                               | Defaults         |
| ---------- | --------| ----------------------------------------- | ---------------- |
| `interval` | integer | The polling interval for `nmap` and `arp` | `5000`           |
| `ip_range` | string  | The IP range passed on to `nmap`          | `192.168.1.1/24` |
| `port`     | integer | Port to run the serve on                  | `3000`           |

Running with forever:
```sh
forever index.js &
```
