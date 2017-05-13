# who-is-home

A simple express server written to support detection of IP addresses present on the Asus RT-N66U router.
_The previous server relying on nmap and ARP can be found in the nmap_arp subdirectory_

In theory, this could also work for other Routers supporting telnet login, by tweaking the options below.

# Dependencies
As the description states, this is a simple express server written using nslookup.

Also, for the moment, this requires `node>6.10`.

# Running it
Running the server with node:
```sh
node index.js
```

A few options can be specified using cli arguments. Below are the supported ones, and their default values.
```sh
node index.js telnet_username=admin telnet_password=its_a_secret
```

| Argument                 | Environment Var          | Type   | Description                                      | required | Defaults            |
|:-------------------------|:-------------------------|:-------|:-------------------------------------------------|:--------:|:--------------------|
| `telnet_username`        | `TELNET_USERNAME`        | string | Username for the telnet login to the Asus router |   Yes    |                     |
| `telnet_password`        | `TELNET_PASSWORD`        | string | Username for the telnet login to the Asus router |   Yes    |                     |
| `interval`               | `INTERVAL`               | string | Interval in ms for updating the mapping          |    No    | `10000`             |
| `port`                   | `PORT`                   | string | Which port the server will run on                |    No    | `3000`              |
| `telnet_port`            | `TELNET_PORT`            | string | Which port to use for the telnet connection      |    No    | `23`                |
| `telnet_timeout`         | `TELNET_TIMEOUT`         | string | Timeout in ms for a telnet connection attempt    |    No    | `1000`              |
| `telnet_host`            | `TELNET_HOST`            | string | Host for the router, to telnet into              |    No    | `"192.168.1.1"`     |
| `telnet_login_prompt`    | `TELNET_LOGIN_PROMPT`    | string | Prompt for telnet script to recognize login      |    No    | `"RT-N66U login: "` |
| `telnet_password_prompt` | `TELNET_PASSWORD_PROMPT` | string | Prompt for telnet script to recognize password   |    No    | `"Password: "`      |
| `arp_location`           | `ARP_LOCATION`           | string | Location of ARP file on the router host          |    No    | `"/proc/net/arp"`   |

Running with forever:
```sh
forever index.js &
```
