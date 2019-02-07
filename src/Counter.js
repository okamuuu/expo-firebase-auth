import React from 'react'
import { Content, Button, Text } from 'native-base';

import { Provider, Subscribe } from 'unstated'

import CounterContainer from './containers/Counter'

const Counter = () => {
  return (
    <Provider>
      <Subscribe to={[CounterContainer]}>
        {counterContainer => (
          <Content>
            <Text>
              Count: { counterContainer.state.count }
            </Text>
            <Button onPress={counterContainer.increment}>
              <Text>Increment</Text>
            </Button>
            <Button onPress={counterContainer.decrement}>
              <Text>Decrement</Text>
            </Button>
          </Content>
        )}
      </Subscribe>
    </Provider>
  )
}

export default Counter
