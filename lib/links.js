module.exports = (specifiedCenter, domain, path) => {
  let apple = {}
  let google = null
  if (specifiedCenter) {
    google = {}
    google.point = `https://www.google.com/maps/search/?api=1&query=${specifiedCenter}`
    google.directions = `https://www.google.com/maps/dir/?api=1&destination=${specifiedCenter}`
  }

  let breadcrumbs = []
  let parts = domain.split('.').reverse()
  let root = [parts.shift(),parts.shift()].reverse().join('.')
  breadcrumbs.push({ name: root, url: `http://${root}` })

  let currentPart = parts.shift()
  let currentDomain = root
  while (currentPart) {
    currentDomain = `${currentPart}.${currentDomain}`
    breadcrumbs.push({name: currentPart, url: `http://${currentDomain}`})
    currentPart = parts.shift()
  }
  breadcrumbs[breadcrumbs.length - 1].active = true
  return {apple, google, breadcrumbs}
}
