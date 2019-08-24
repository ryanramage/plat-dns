module.exports = (domain) => {
  let atoms = domain.split('.')
  let rootDomain = atoms.slice(-2).join('.')
  return rootDomain
}
