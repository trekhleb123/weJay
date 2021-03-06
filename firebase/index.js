import * as firebase from 'firebase';
import firestore from 'firebase/firestore';
import { refreshTokens, addSong } from '../api/spotify';
// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: 'wejay-254716'
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
export default db;

//create room
export async function createRoom(roomData) {
  try {
    const newRoom = await db.collection('Rooms').add(roomData);
    //add gives the room a unique ID on firebase
    console.log(`${roomData.title} was created!`);
    return newRoom.id;
    //TestRoom gets overwritten, have to check if name exists first or use add() instead
  } catch (err) {
    console.log(err);
  }
}
//get room with password and hostName
export async function getRoom(passcode, hostName) {
  let result = {};
  try {
    let roomRef = db.collection('Rooms');
    //query room via passcode
    let query = await roomRef
      .where('passcode', '==', passcode)
      .where('hostName', '==', hostName)
      .get();
    if (query.empty) {
      console.log("room doesn't exist or invalid password");
    } else {
      query.forEach(doc => (result = doc.data()));
    }
  } catch (err) {
    console.log(err);
  }
}

export async function enterRoom(passcode, roomName, userName) {
  let result = {};
  try {
    let roomRef = db.collection('Rooms');
    //query room via passcode
    let query = await roomRef
      .where('passcode', '==', passcode)
      .where('title', '==', roomName)
      .get();
    if (query.empty) {
      console.log("room doesn't exist or invalid password");
      return 'Invalid credentials';
    } else {
      query.forEach(doc => {
        result = doc.id;
      });
      console.log('You are in the room!');
    }
    return result;
  } catch (err) {
    console.log(err);
  }
  return result;
}

//getRoom data
export const getRoomData = async docId => {
  let roomRef = db.collection('Rooms').doc(docId);
  try {
    let result = await roomRef.get();
    return result.data();
  } catch (err) {
    console.log(err);
  }
};
//get token
export async function refreshRoomToken(docId) {
  try {
    let currentRoomData = await getRoomData(docId);
    let result = await refreshTokens(currentRoomData.refreshToken);
    currentRoomData.accessToken = result.access_token;
    currentRoomData.expiresIn = result.expires_in;
    //update room data
    let roomRef = db.collection('Rooms').doc(docId);
    roomRef.update(currentRoomData);
    return currentRoomData;
  } catch (err) {
    console.log(err);
  }
}

export async function addSongToDB(roomId, songData) {
  try {
    const playlist = db
      .collection('Rooms')
      .doc(roomId)
      .collection('Playlist');
    await playlist.add(songData);
    console.log('song was added!');
    //return newPlaylist?
  } catch (err) {
    console.log(err);
  }
}
export function subToPlaylist(roomId, userName) {
  try {
    let songArr = [];
    let roomRef = db.collection('Rooms').doc(roomId);
    let unsub = roomRef
      .collection('Playlist')
      .orderBy('timeAdded')
      .onSnapshot(snapshot => {
        snapshot.forEach(doc => {
          songArr.push(doc.data());
        });
        snapshot.forEach(doc =>
          roomRef
            .collection('Playlist')
            .doc(doc.id)
            .set(
              {
                users: {
                  [userName]: null
                }
              },
              { merge: true }
            ));
      });
    return songArr;
  } catch (err) {
    console.log(err);
  }
}
//get playlist return array of song objects (ideally?)
export async function getPlaylist(roomId) {
  let songArr = [];
  try {
    const playlist = db
      .collection('Rooms')
      .doc(roomId)
      .collection('Playlist')
      .orderBy('timeAdded');
    //   .orderBy('votes', 'desc');
    let allSongs = await playlist.get();
    if (allSongs.empty) {
      return songArr;
    }
    allSongs.forEach(song => {
      songArr.push(song.data());
    });
    return songArr;
  } catch (err) {
    console.log(err);
  }
}

export async function updateVote(songId, vote, userName, docId) {
  let songsRef = db
    .collection('Rooms')
    .doc(docId)
    .collection('Playlist');

  try {
    let query = await songsRef.where('id', '==', songId).get();
    if (query.empty) {
      console.log('something went wrong');
    } else {
      query.forEach(doc => {
        let songRef = songsRef.doc(doc.id);
        let songData = doc.data();
        if (vote === 'up' && songData.users[userName] !== 'up') {
          //increment vote
          songRef.update({
            votes: firebase.firestore.FieldValue.increment(1)
          });
        } else if (vote === 'down' && songData.users[userName] !== 'down') {
          //decrease vote
          songRef.update({
            votes: firebase.firestore.FieldValue.increment(-1)
          });
        }
        songRef.update({ ['users.' + userName]: vote });
      });
    }
  } catch (err) {
    console.log(err);
  }
}

export async function setCurrentSong(roomData, docId) {
  let songDocId;
  let roomRef = db.collection('Rooms').doc(docId);
  let currentSong = roomData.queue[0];
  let newQueue = roomData.queue.slice(1);
  //set currentSong
  roomRef.set({ currentSong }, { merge: true });
  roomRef.update({ queue: newQueue });
  //get playlist
  let playlistRef = db
    .collection('Rooms')
    .doc(docId)
    .collection('Playlist');
  try {
    //add current song to master playlist
    let result = await refreshRoomToken(docId);
    //add song to spotify playlist
    await addSong(result, currentSong);
    let finalPlaylist = roomRef.collection('Final Playlist');
    await finalPlaylist.add({
      addedToFP: Date.now(),
      currentSong
    });
    //find song, and remove it from playlist collection
    let query = await playlistRef.where('id', '==', currentSong.id).get();
    query.forEach(doc => (songDocId = doc.id));
    await playlistRef.doc(songDocId).delete();
  } catch (err) {
    console.log(err);
  }
  return currentSong;
}

export async function pauseCurrentSong(docId, progress) {
  try {
    let roomRef = db.collection('Rooms').doc(docId);
    await roomRef.update({ 'currentSong.progress': progress });
  } catch (err) {
    console.log(err);
  }
}
export async function getCurrentSongData(docId) {
  try {
    let roomRef = await db
      .collection('Rooms')
      .doc(docId)
      .get();
    let currentSong = roomRef.data().currentSong;
    return currentSong;
  } catch (err) {
    console.log(err);
  }
}
export async function getFinalPlaylist(docId) {
  let playlistArr = [];
  try {
    let finalPlaylistRef = db
      .collection('Rooms')
      .doc(docId)
      .collection('Final Playlist');
    let finalpl = await finalPlaylistRef.orderBy('addedToFP', 'asc').get();
    finalpl.forEach(doc => playlistArr.push(doc.data()));
    console.log('in final playlist ', playlistArr);
    return playlistArr;
  } catch (err) {
    console.log(err);
  }
}
//add users to playlist
