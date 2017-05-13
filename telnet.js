const express = require('express')
const telnet  = require('telnet-client')
const exec    = require('child_process').exec

const cliArgs = process.argv.slice(2)

if (cliArgs.some(arg => !arg.includes('='))) {
  console.error('Expect CLI args on the form argument=value')
  process.exit(1)
}

const cli = cliArgs.reduce((obj, pair) => {
  const [key, val] = pair.split('=')
  return Object.assign(obj, {[key]: val})
}, {})

const USERNAME        = cli.telnet_username         || process.env.TELNET_USERNAME
const PASSWORD        = cli.telnet_password         || process.env.TELNET_PASSWORD
const UPDATE_INTERVAL = parseInt(cli.interval       || process.env.INTERVAL      )        || 10000
const PORT            = parseInt(cli.port           || process.env.PORT          )        || 3000
const TELNET_PORT     = parseInt(cli.telnet_port    || process.env.TELNET_PORT   )        || 23
const TELNET_TIMEOUT  = parseInt(cli.telnet_timeout || process.env.TELNET_TIMEOUT)        || 1000
const TELNET_HOST     = cli.telnet_host             || process.env.TELNET_HOST            || '192.168.1.1'
const LOGIN_PROMPT    = cli.telnet_login_prompt     || process.env.TELNET_LOGIN_PROMPT    || 'RT-N66U login: '
const PASSWORD_PROMPT = cli.telnet_password_prompt  || process.env.TELNET_PASSWORD_PROMPT || 'Password: '
const ARP_LOCATION    = cli.arp_location            || process.env.ARP_LOCATION           || ''

if (USERNAME === undefined || PASSWORD === undefined) {
  console.error('Need to specify username and password to access router')
  process.exit(0)
}

// App and the in-memory cache for the IP addresses present on the network
const app = express()
let ipMap = {}

// Timer label to time execution for the Telnet connection
const TIMER_LABEL = 'Telnet connection latency'

setInterval(() => {
  const connection = new telnet()
  console.time(TIMER_LABEL)
  /* We've successfylly esptablished a connection to the router.
   */
  connection.on('ready', function(prompt) {
    console.log('Telnet connection to router open')
    /* The ARP table is stored in /proc/net/arp on the RT-N66U Asus router, so
     * we reed that and parse it's contents.
     */
    connection.exec(`cat ${ARP_LOCATION}`, (err, response) => {
      if (err) {
        console.error('Failed to execute ARP read on router' + err)
        return connection.end()
      }

      const lines = response.split('\n')

      // Pop the first line in the array, and use that for header values. We
      // expect headers to be separated by more than one whitespace. For the
      // remaining values, replace the whitespaces with
      const headers = lines.shift().split(/\s\s+/).map(
          h => h.toLowerCase().replace(' ', '_'))

      const newIpMap = lines.reduce((accumulator, line) => {
        const parts = line.split(/\s+/),
          ipAddress = parts[0],
          // There might already be an object that we are interested in for
          // this entry.
          obj = ipMap[ipAddress] || {}

          // TODO: Enable cache invalidation of name here as well.
          if (obj.name === undefined) {
            // Refresh our cached value

            exec(`nslookup ${ipAddress}` , (err, result, stderr) => {
              if (err) {
                return console.error('nslookup failure for IP ' + ipAddress)
              }

              const res = result.match(/name\ =\ .*\./)
              obj.name = res ? res[0].split(' = ')[1].replace('.', '') : ''
            })
          }

          // Assign the restp of the properties to the object
          for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = parts[j]
          }

          accumulator[ipAddress] = obj
          return accumulator
      }, {})

      ipMap = newIpMap
      // Make sure to close the connection when we are done.
      connection.end()
    })
  })

  connection.on('failedLogin', function(prompt) {
    console.error(
      'Failed to login, please verify your credentials/promt settings')
    connection.end()
  })

  connection.on('timeout', function() {
    console.error('Telnet socket timeout')
    connection.end()
  })

  connection.on('close', function() {
    console.info('Telnet connection to router closed')
    console.timeEnd(TIMER_LABEL)
  })

  connection.connect({
    host:           TELNET_HOST,
    port:           TELNET_PORT,
    username:       USERNAME,
    password:       PASSWORD,
    loginPrompt:    LOGIN_PROMPT,
    passwordPrompt: PASSWORD_PROMPT,
    timeout:        TELNET_TIMEOUT,
  })
}, UPDATE_INTERVAL)

app.get('/ip', (req, res) => {
  res.send(ipMap)
})

app.listen(PORT, '0.0.0.0')
