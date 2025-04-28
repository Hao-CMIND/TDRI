export default class ShuffleText {
  constructor (el) {
    this.sourceRandomCharacter = '1234567890'
    this.emptyCharacter = '0'
    this.isRunning = false
    this.duration = 1000
    this._randomIndex = []

    this._el = el
    this._originalStr = el.textContent
    this.init()
  }

  init () {
    this._randomIndex = []
    let str = ''
    for (let i = 0; i < this._originalStr.length; i++) {
      const rate = i / this._originalStr.length
      this._randomIndex[i] = Math.random() * (1 - rate) + rate
      str += this.emptyCharacter
    }
    this._el.textContent = str
  }

  start () {
    this.isRunning = true
    requestAnimationFrame(this._onInterval.bind(this, Date.now()))
  }

  _onInterval (start) {
    const _timeCurrent = Date.now() - start
    const percent = _timeCurrent / this.duration
    let str = ''
    for (let i = 0; i < this._originalStr.length; i++) {
      const randI = this._randomIndex[i]
      if (percent >= randI) {
        str += this._originalStr.charAt(i)
        continue
      }
      if (percent < randI / 3) {
        str += this.emptyCharacter
        continue
      }
      if (percent > randI / 3 && percent < randI) {
        str += this.sourceRandomCharacter.charAt(Math.floor(Math.random() * this.sourceRandomCharacter.length))
      }
    }
    if (percent > 1) {
      str = this._originalStr
      this.isRunning = false
    }
    this._el.textContent = str
    if (this.isRunning) {
      requestAnimationFrame(this._onInterval.bind(this, start))
    }
  }
}
