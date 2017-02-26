const express = require('express')
const exec = require('child_process').exec;

const app = express()

const cliArgs = process.argv.slice(2)

if (cliArgs.some(arg => !arg.includes('='))) {
  console.error('Expect CLI args on the form argument=value')
  process.exit(1)
}

const cli = cliArgs.reduce((obj, pair) => {
  const [key, val] = pair.split('=')
  if (!['interval', 'ip_range', 'port'].includes(key)) return obj
  return Object.assign(obj, {[key]: val})
}, {})

const UPDATE_INTERVAL = parseInt(cli.interval) || 5000
const IP_RANGE        = cli.ip_range           || '192.168.1.1/24'
const PORT            = parseInt(cli.port)     || 3000

var arpTable = {}
setInterval(() => {
  /* On an interval basis, execute an ARP lookup for the locally stored cache,
   * between IP addresses and MAC-addresses. This splits the output of the
   * arp command and processes line by line each entry, that is expected to
   * be on the form:
   * name (192.168.0.127) at ac:5f:3e:36:77:a9 on en0 ifscope [ethernet]
   *
   * As bot IP and MAC address may be surrounded by parantheses, it is made
   * sure that these are removed before populating the arpMap object. The
   * arpMap object is also cleared, so that cache updates is reflected here
   * as well.
   */
   exec("arp -a", (error, result, stderr) => {
    arpTable = {}
    result.split('\n')
      .filter(line => line != "")
      .forEach(line => {
        let [name, ip, _, mac, __] = line.split(' ')
        ip = ip.replace(/\(|\)/g, '')
        mac = mac.replace(/\(|\)/g, '')
        arpTable[ip] = {name, mac}
      })
  })
}, UPDATE_INTERVAL)

var ipMap = {}
setInterval(() => {
  /* On an interval basis, execute an nmap lookup for the devices on the
   * network. This splits the output of the nmap command and processes line
   * by line each entry, that is expected to be on the form:
   * Starting Nmap 7.12 ( https://nmap.org ) at 2017-02-26 17:15 GMT
   *
   *
   * The name might be missing, in that case we fall back to any existing
   * lower-case name from the ARP map
   * As the IP address may be surrounded by parentatheses, we make sure to
   * remove them from the IP.
   * The ipMap object is cleared, so that devices can leave the network.
   */
  exec(`nmap -sP ${IP_RANGE}` , (error, result, stderr) => {
    ipMap = {}
    result
      .split('\n')
      .filter(line => !["Starting Nmap", "Nmap done", "Host is up"].some(
            w => line.includes(w)))
      .map(line => line.replace(/^Nmap scan report for /, ''))
      .filter(line => line != "")
      .forEach(line => {
        let [name, ip] = line.split(' ')
        if (ip == undefined) {
          ip = name
          name = arpTable[ip] ? arpTable[ip].name : '?'
        } else {
          ip = ip.replace(/\(|\)/g, '')
        }

        ipMap[ip] = Object.assign({}, arpTable[ip], {name, ip})
      })
  })
}, UPDATE_INTERVAL)

// Helpful message when pointing to the root.
app.get('/', (_, res) => res.send('Supported GET operations: [' +
      '<a href="/ip">IP</a>, <a href="mac">MAC</a>]'))

/* Returns all known IPs at this moment, or at least since the last lookup
 * nmap and arp. */
app.get('/ip', (_, res) => res.send(ipMap))

/* Flips the map to contain MAC addresses as keys in the lookup map. This
 * filters out entries that contain no known MAC address. */
app.get('/mac', (req, res) => {
  const macMap = {}
  Object.keys(ipMap)
    .map(key => ipMap[key])
    .filter(item => !!item.mac)
    .forEach(item => { macMap[item.mac] = item; })

  res.send(macMap)
})

app.listen(PORT, '0.0.0.0')

