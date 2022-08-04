function patchEs5Ext(deps) {
  if (deps?.['es5-ext']) {
    deps['es5-ext'] = '0.10.53'
  }
}

function readPackage(pkg, context) {
  patchEs5Ext(pkg.dependencies)
  patchEs5Ext(pkg.devDependencies)
  return pkg
}

module.exports = {
  hooks: { readPackage },
}
