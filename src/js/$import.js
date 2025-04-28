import { $, ready, create, html, on, off, one, trigger, scrollTop, toggleClass, hasClass, addClass, removeClass, height, parent, parents, siblings, prevAll, nextAll, children, nth, find, val, next, prev, bounding, attr, prop, txt, data, width, css, remove, append } from './$.js'
import Collapse from 'bs5/js/src/collapse'
import Dropdown from 'bs5/js/src/dropdown'
import Carousel from 'bs5/js/src/carousel'
import Popover from 'bs5/js/src/popover'
import Tooltip from 'bs5/js/src/tooltip'
import Modal from 'bs5/js/src/modal'
import Offcanvas from 'bs5/js/src/offcanvas'
import ScrollSpy from 'bs5/js/src/scrollspy'
import Tab from 'bs5/js/src/tab'
import Toast from 'bs5/js/src/toast.js'
$.use(ready, create, html, on, off, one, trigger, scrollTop, toggleClass, hasClass, addClass, removeClass, height, parent, parents, siblings, prevAll, nextAll, children, nth, find, val, next, prev, bounding, attr, prop, txt, data, width, css, remove, append)
Object.assign(Popover.Default.allowList, {
  button: ['data-action', 'type'],
  menu: [],
  svg: ['viewBox', 'width', 'height', 'text-anchor'],
  g: ['class', 'color', 'fill', 'transform', 'text-anchor', 'font-family', 'font-size'],
  path: ['class', 'fill', 'stroke', 'x', 'y', 'transform', 'd'],
  circle: ['class', 'fill', 'x', 'y', 'r', 'transform'],
  rect: ['class', 'fill', 'x', 'y', 'width', 'height', 'data-bs-toggle', 'data-bs-title', 'data-bs-content', 'data-bs-trigger', 'data-bs-html'],
  line: ['class', 'stroke', 'x1', 'x2', 'y1', 'y2'],
  text: ['class', 'fill', 'x', 'y', 'dx', 'dy', 'transform', 'alignment-baseline', 'text-anchor'],
  img: ['width', 'src'],
  a: ['href', 'target']
})

$.bootstrap(['Collapse', Collapse], ['Dropdown', Dropdown], ['Carousel', Carousel], ['Modal', Modal], ['Popover', Popover], ['ScrollSpy', ScrollSpy], ['Tab', Tab], ['Tooltip', Tooltip], ['Toast', Toast], ['Offcanvas', Offcanvas])
export default $
