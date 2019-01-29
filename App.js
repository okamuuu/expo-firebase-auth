import React from 'react';
import { Button, View } from 'react-native';
import { Container, Header, Content, List, ListItem, Text } from 'native-base';
import { createStackNavigator, createAppContainer } from 'react-navigation'; 

class HomeScreen extends React.Component {
  render() {
    return (
      <Container>
        <Header />
        <Content>
          <List>
            <ListItem>
              <Text onPress={() => this.props.navigation.navigate('Details')}>Firebase Authentication</Text>
            </ListItem>
            <ListItem>
              <Text>xxxx</Text>
            </ListItem>
            <ListItem>
              <Text>xxxx</Text>
            </ListItem>
          </List>
        </Content>
      </Container>
    );
  }
}

class DetailsScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Details Screen</Text>
        <Button
          title="Go to Details... again"
          onPress={() => this.props.navigation.navigate('Details')}
        />
      </View>
    );
  }
}

const RootStack = createStackNavigator(
  {
    Home: HomeScreen,
    Details: DetailsScreen,
  },
  {
    initialRouteName: 'Home',
  }
);

const AppContainer = createAppContainer(RootStack);

export default class App extends React.Component {

  async componentWillMount() {
    await Expo.Font.loadAsync({
      'Roboto': require('native-base/Fonts/Roboto.ttf'),
      'Roboto_medium': require('native-base/Fonts/Roboto_medium.ttf'),
    });
  }

  render() {
    return <AppContainer />;
  }
}
