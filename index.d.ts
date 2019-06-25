import preact from 'preact'

declare module 'preact-head' {
  export default class Head extends preact.Component {
    public static rewind(): preact.JSX.Element
  }
}
