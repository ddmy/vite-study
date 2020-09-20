const fs = require('fs')
const path = require('path')
const compilerSfc = require('@vue/compiler-sfc')
const compilerDom = require('@vue/compiler-dom')

function rewriteImport (content){
  return content.replace(/ from ['|"]([^'"]+)['|"]/g, (s0, s1) => {
    if (!s1.endsWith('.') && !s1.endsWith('/')) {
      return ` from '/@modules/${s1}'`
    }
    return s0
  })
}

module.exports = (ctx, next) => {
  if (ctx.url === '/') {
    let data = fs.readFileSync(path.join(__dirname, '../src/index.html'), 'utf-8')
    data = data.replace('<script', `
      <script>
        // 注入一个socket客户端
        // 后端的文件变了，通知前端去更新
        window.process = {
          env: {NODE_EV:'dev'}
        }
      </script>
      <script
    `)
    ctx.type = 'text/html'
    ctx.status = 200
    ctx.body = data
  } else if (ctx.url.endsWith('.js')) {
    let data = fs.readFileSync(path.join(__dirname, '../src', ctx.url), 'utf-8')
    ctx.type = 'application/javascript'
    ctx.body = rewriteImport(data)
  } else if (ctx.url.startsWith('/@modules')) {
    // node_modules 里面的模块
    const modulePath = path.join(__dirname, '../node_modules', ctx.url.replace('/@modules', ''))
    const moduleEntry = require(modulePath + '/package.json').module
    const data = fs.readFileSync(modulePath + '/' + moduleEntry, 'utf-8')
    ctx.type = 'application/javascript'
    ctx.body = rewriteImport(data)
  } else if (ctx.url.indexOf('.vue') > -1) {
    // 解析单文件组件
    const data = fs.readFileSync(path.join(__dirname, '../src', ctx.url.split('?')[0]), 'utf-8')
    const { descriptor} = compilerSfc.parse(data)
    if (!ctx.query.type) {
      ctx.type = "application/javascript"
      ctx.body = `
        ${rewriteImport(descriptor.script.content.replace('export default ', 'const __script = '))}
        import {render as __render} from "${ctx.url}?type=template"
        __script.render = __render
        export default __script
      `
    } else if (ctx.query.type === 'template') {
      // 解析template， 转成 render函数
      const template = descriptor.template
      const data = compilerDom.compile(template.content, { mode: 'module'}).code
      ctx.type = 'application/javascript'
      ctx.body = rewriteImport(data)
    }

  } else if (ctx.url.endsWith('.css')) {
    const data = fs.readFileSync(path.join(__dirname, '../src', ctx.url), 'utf-8')
    const content = `
    const css = "${data.replace(/\n/g,'')}"
    const link = document.createElement('style')
    link.setAttribute('type', 'text/css')
    document.head.appendChild(link)
    link.innerHTML = css
    export default css
  `
  ctx.type = 'application/javascript'
  ctx.body = content
  } else {
    console.log('资源未解析', ctx.url)
  }
  next()
}