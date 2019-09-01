const tape = require('tape')
const links = require('../lib/links')

tape('breadcrumbs', t => {
  let result = links('1,1', 'yoshi.food.locations.ramage.in', '/in/ramage/locations/food/yoshi.json')
  console.log(result)
  t.ok(result)
  t.equals(result.breadcrumbs.length, 4)
  t.end()
})
