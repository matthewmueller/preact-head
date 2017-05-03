import render from 'preact-render-to-string'
import { h, Component } from 'preact' /* @jsx h */
import Head from '../'

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
    	<Head>
        <meta name="Whatever2" content={state.count} />
      </Head>
      <Head>
        <title>{state.count + 2}</title>
        <meta name="Whatever" content={state.count} />
      </Head>
      <Sub count = {state.count} />
      </div>
    )
  }
}

class Sub extends Component {
	render(props, state) {
  	return (
    	<span>
	    	<Head>
	        <meta name="Sub" content={props.count} />
	      </Head>
      </span>
    )
  }
}

console.log(render(<Demo />))
console.log(Head.rewind().map(render).join(''));
console.log(render(<Demo />))
console.log(Head.rewind().map(render).join(''));