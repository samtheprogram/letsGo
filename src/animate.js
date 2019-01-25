import { ADD, REMOVE, TOGGLE, HIDDEN } from './constants';
import * as error from './error';

const MAIN_CLASS = 'lg-animate';
const getClass = (attribute, result, active = false) => {
  let out = `${attribute}-${result}`;
  if (active) {
    out = `${out}-active`;
  }
  return out;
};
const toggle = check => check ? REMOVE : ADD;
const NUM_REGEX = /[^\d.]/g;
const fromTime = time => +time.replace(NUM_REGEX, '');
const findAnimateTime = times =>
  times.split(',').reduce((out, time) => Math.max(fromTime(time), out), 0);
const animationEnd = element => new Promise(resolve => {
  let listener = () => {
    resolve(listener);
  };
  element.addEventListener('animationend', listener, false);
}).then(listener => element.removeEventListener('animationend', listener, false));

export default function prepare(command, target, attribute = HIDDEN) {
  let elements = [];
  elements = [...document.querySelectorAll(target)];
  if (elements.length < 1) {
    error.log(`no element of '${target}' found on page.`);
    return async () => {
      // intentionally left blank. LetsGo will continue with an error at runtime.
    };
  }
  let isClass = false;
  let value = '';
  if (attribute.charAt(0) === '#') {
    attribute = 'id';
    value = attribute.substring(1);
  } else if (attribute.charAt(0) === '.') {
    isClass = true;
    attribute = attribute.substring(1);
  } else {
    [attribute, value = ''] = attribute.split('=');
  }
  return () => Promise.all(elements.map(async element => {
    let result = command;
    if (result === TOGGLE) {
      if (isClass) {
        result = toggle(element.className.includes(attribute));
      } else if (value) {
        result = toggle(element.hasAttribute(attribute)
          && (element.getAttribute(attribute) === value));
      } else {
        result = toggle(element.hasAttribute(attribute));
      }
    }
    element.classList.add(MAIN_CLASS);
    let actionClass = getClass(attribute, result);
    let activeClass = getClass(attribute, result, true);
    element.classList.add(actionClass);
    if (result === REMOVE) {
      if (isClass) {
        element.classList.remove(attribute);
      } else {
        element.removeAttribute(attribute);
      }
    }
    let styles = window.getComputedStyle(element, null);
    if ((fromTime(styles.transitionDuration) > 0) || (fromTime(styles.animationDuration) > 0)) {
      element.classList.add(activeClass);
      let maxTransitionTime = findAnimateTime(styles.transitionDuration);
      let maxAnimationTime = findAnimateTime(styles.animationDuration)
        * styles.animationIterationCount;
      if (maxAnimationTime >= maxTransitionTime) {
        await animationEnd(element);
      } else {
        await new Promise(res =>
          setTimeout(res, Math.ceil(Math.max(maxTransitionTime, maxAnimationTime) * 1000)));
      }
    }
    if (result === ADD) {
      if (isClass) {
        element.classList.add(attribute);
      } else {
        element.setAttribute(attribute, value);
      }
    }
    element.classList.remove(actionClass);
    element.classList.remove(activeClass);
    element.classList.remove(MAIN_CLASS);
  }));
}