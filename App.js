//UNALTERED BOILER PLATE CODE CAN BE FOUND IN APPTEST.JS

'use strict';
import React, { Component, useState } from 'react';
import {
  createStackNavigator,
  createAppContainer,
  createDrawerNavigator,
  createSwitchNavigator
} from 'react-navigation';
import { DrawerActions } from 'react-navigation-drawer';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

//screens
import HomeScreen from './screens/HomeScreen';
import CreatePlaylistForm from './screens/CreatePlaylistForm';
import JoinPlaylistForm from './screens/JoinPlaylistForm';
import PlaylistRoom from './screens/PlaylistRoom';
import SearchScreen from './screens/SearchScreen';
import Playback from './screens/Playback';
require('./secrets');

//redux
import store from './redux/store';
import { Provider } from 'react-redux';

export default class ReactNav extends Component{
    render(){
        return( 
            <Provider store={store}>
                <App />
            </Provider>
        );
    }
  }
// export default function ReactNav(){
//   const [docId, setDocId] = useState('');
//   const [hostName, setHostName] = useState('');
//   return( 
//       <Provider store={store}>
//           <App />
//       </Provider>
//   );
// }

const DrawerNav = createDrawerNavigator({
  Home: {
    screen: HomeScreen,
    navigationOptions: {
      title: 'weJay'
    }
  },
  CreatePlaylistForm: {
    screen: CreatePlaylistForm,
    navigationOptions: {
      title: 'Create Playlist'
    }
  },
  JoinPlaylistForm: {
    screen: JoinPlaylistForm,
    navigationOptions: {
      title: 'Join Playlist'
    }
  }
  // PlaylistRoom: {
  //   screen: PlaylistRoom,
  //   navigationOptions: {
  //     title: 'Current Playlist'
  //   }
  // }
});

const StackNav = createStackNavigator({
  DrawerNav: {
    screen: DrawerNav,
    headerMode: 'float',
    navigationOptions: ({ navigation }) => {
      const { state } = navigation;

      if (state.isDrawerOpen) {
        return {
          headerLeft: (
            <TouchableOpacity
              onPress={() => {
                navigation.dispatch(DrawerActions.toggleDrawer());
              }}
            >
              <Feather name="menu" size={32} color="#4392F1" />
            </TouchableOpacity>
          )
        };
      } else {
        return {
          headerLeft: (
            <TouchableOpacity
              onPress={() => {
                navigation.dispatch(DrawerActions.toggleDrawer());
              }}
            >
              <Feather name="menu" size={32} color="#4392F1" />
            </TouchableOpacity>
          )
        };
      }
    }
  },
  Home: { screen: HomeScreen },
  CreatePlaylistForm: { screen: CreatePlaylistForm },
  JoinPlaylistForm: { screen: JoinPlaylistForm },
  PlaylistRoom: {
    screen: PlaylistRoom,
    navigationOptions: ({ navigation }) => ({
        headerRight: (
          <TouchableOpacity
            onPress={() => navigation.navigate('Playback')}
          >
            <View style={styles.headerContainer}>
              <Text style={styles.nowPlayingText}>Now Playing</Text>
              <Feather
                name="music"
                size={30}
                color="#4392F1"
                style={styles.musicnote}
              />
            </View>
          </TouchableOpacity>
        ),
        headerLeft: (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('Home');
            }}
          >
            <Feather name="chevron-left" size={32} color="#4392F1" />
          </TouchableOpacity>
        )
      })
  },
  SearchScreen: { screen: SearchScreen },
  Playback: {
    screen: Playback
  }
});

const MainNav = createSwitchNavigator({
  App: StackNav
});

const App = createAppContainer(MainNav);

const styles = StyleSheet.create({
    headerContainer: {
      display: 'flex',
      flexDirection: 'row'
    },
    feather: { marginLeft: 'auto' },
    nowPlayingText: {
      color: '#4392F1',
      fontSize: 18,
      paddingRight: 3,
      paddingTop: 5
    },
    musicnote: {
      paddingRight: 10
    }
  });
  