export default function () {
  const group = [...document.querySelectorAll('.stagger-animate')].map(el => {
    const staggerTime = el.dataset.stagger // 錯開時間

    staggerTime && el.querySelectorAll('[class*=ani-fade-]').forEach((ani, i) => {
      ani.style.transitionDelay = i * staggerTime + 's' // 設定 delay
    })
    return el
  })
  return () =>
    group.forEach((el, i) => {
      const { top } = el.getBoundingClientRect() // 抓取container 高度
      if (top < 0) return

      const offset = el.dataset.anioffset || 0 // 抓取偏移高度
      if (top - offset < innerHeight / 2) {
        el.querySelectorAll('[class*=ani-fade-]').forEach(ani => {
          ani.classList.add('fade-enter-active')
        })
        group.splice(i, 1) // 執行完剔除
      }
    })
}
