import fs from 'fs-extra'

let data = new Date().toLocaleDateString('en-us', { year: 'numeric', month: 'long' })

fs.writeFile('.lastupdate', data, (err) => {
  if (err) console.log(err)
  else {
    console.log('The written has the following contents:')
    console.log(fs.readFileSync('.lastupdate', 'utf8'))
  }
})
