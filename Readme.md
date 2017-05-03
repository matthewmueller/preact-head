# Preact-head

Standalone, declarative `<Head />` for [Preact](https://github.com/developit/preact).

Supports both [client](example/client.js) and [server-side](example/server.js) rendering.

## Example

```jsx
<Head>
  <title>{state.title}</title>
  <meta name="Whatever" content={state.count} />
</Head>
```

## Installation

```
yarn add preact-head
```

## Credit

This was inspired by and ported from [next.js](https://github.com/zeit/next.js) & [react-declarative-head](https://github.com/josepapaianni/react-declarative-head) with adjustments to make it work with well with Preact.

## License

MIT