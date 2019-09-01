module.exports = (specifiedCenter, domain) => {
  let apple = {
    // point:
    // directions:
  }
  let google = {
    point: `https://www.google.com/maps/search/?api=1&query=${specifiedCenter}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${specifiedCenter}`
  }
  return {apple, google, breadcrumb}
}
