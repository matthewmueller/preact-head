/* @jsx h */
import { h, render, Component, cloneElement } from 'preact'
import Head from '../index.js'


class Demo extends Component {
	constructor (props) {
		super(props)
    this.state = {
    	count: 0
    }
	}
  
  componentDidMount() {
		setInterval(() => this.setState({ count: this.state.count+1 }), 1000)
	}
  
	render(props, state) {
  	return (
    	<div>
    	<Head key={0}>
        <meta name="Whatever2" content={state.count} dangerouslySetInnerHTML={{__html: "whatever" }} />
      </Head>
      <Head key={1}>
        <title>{state.count + 2}</title>
        <meta name="Whatever" content={state.count} dangerouslySetInnerHTML={{__html: "whatever" }} />
      </Head>
      </div>
    )
  }
}

render(<Demo />, document.body)