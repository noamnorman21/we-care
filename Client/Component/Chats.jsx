import { View, Text, StyleSheet, Dimensions, Image, Alert, Modal, TouchableOpacity, ScrollView, Platform, SafeAreaView, ActivityIndicator } from 'react-native'
import { useCallback, useState, useLayoutEffect } from 'react'
import { auth, db } from '../config/firebase';
// import { GiftedChat, Bubble, Time, MessageImage } from 'react-native-gifted-chat';
import { collection, addDoc, getDocs, getDoc, query, orderBy, onSnapshot, updateDoc, where, limit, doc, increment, deleteDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { useUserContext } from '../UserContext';
import { Feather, Entypo, EvilIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// import AddNewGroupChat from './ChatComponents/AddNewGroupChat';
// import { useFocusEffect } from '@react-navigation/native';
// import { InputToolbar, Actions } from 'react-native-gifted-chat';
// import * as ImagePicker from 'expo-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import { storage } from '../config/firebase';
// import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
// import { TextInput } from 'react-native-paper';
import moment from 'moment';
import { Searchbar } from 'react-native-paper';

const ScreenHeight = Dimensions.get("window").height;
const ScreenWidth = Dimensions.get("window").width;

import ChatProfile from './ChatComponents/ChatProfile';
import ChatRoom from './ChatComponents/ChatRoom';
import { Swipeable } from 'react-native-gesture-handler';

const Stack = createStackNavigator();
export default function Chats({ navigation }) {
  return (
    <Stack.Navigator initialRouteName='MainRoom' screenOptions={{
      //this is the animation for the navigation
      ...TransitionPresets.SlideFromRightIOS,
      headerBlurEffect: 'light',
    }} >
      <Stack.Screen name="ChatRoom" component={ChatRoom} options={{ headerShown: true, headerTitleAlign: 'center' }} />
      <Stack.Screen name="MainRoom" component={MainRoom} options={{ headerShown: false, headerTitleAlign: 'center' }} />
      <Stack.Screen name="ChatProfile" component={ChatProfile} options={{ headerShown: true, headerTitle: '' }} animationType="slide" />
    </Stack.Navigator>
  )
}

function MainRoom({ navigation }) {
  const [chatsToDisplay, setchatsToDisplay] = useState([])
  const { userContext, setNewMessages } = useUserContext();
  const [users, setUsers] = useState([])
  const [userChats, setUserChats] = useState([])
  const [usersToDisplay, setUsersToDisplay] = useState([])
  const [addNewModal, setAddNewModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [addNewModalGroup, setAddNewModalGroup] = useState(false)
  const [publicGroupNames, setPublicGroupNames] = useState([])
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onChangeSearch = query => searchQuery(query);

  useEffect(() => {
    if (userContext) {
      const tempNames = query(collection(db, auth.currentUser.email), orderBy("lastMessageTime", "desc"));
      // add listener to names collection
      const getNames = onSnapshot(tempNames, (snapshot) => setUserChats(
        snapshot.docs.map(doc => ({
          key: doc.data().Name,
          Name: doc.data().Name,
          UserName: doc.data().UserName,
          userEmail: doc.data().userEmail,
          image: doc.data().image,
          unread: doc.data().unread,
          unreadCount: doc.data().unreadCount,
          lastMessage: doc.data().lastMessage,
          lastMessageTime: doc.data().lastMessageTime.toDate(),
          type: doc.data().type
        }))
      ));
      const tempUsers = query(collection(db, "AllUsers"), where("id", "!=", auth.currentUser.email));
      // add listener to users collection
      const getUsers = onSnapshot(tempUsers, (snapshot) => setUsers(
        snapshot.docs.map(doc => ({
          id: doc.data().id,
          name: doc.data().name,
          avatar: doc.data().avatar,
          userType: doc.data().userType,
        }))
      ))

      return () => {
        getNames();
        getUsers();
        setNewMessages(0);
      }
    }
    else {
      console.log("no user context")
      setUserChats([])
    }
  }, [auth.currentUser.email])

  useEffect(() => {
    //relevant- from user context
    if (userChats) {
      setNewMessages(0);
      const renderNames = () => {
        setchatsToDisplay(userChats.map((name, index) => (
          <ConvoCard key={name.Name} name={name} userEmails={name.userEmails} />
        )))
      }
      let x = 0;
      userChats.map((name) => {
        x += name.unreadCount;
      })
      setNewMessages(x);
      renderNames();
    }
    else {
      setchatsToDisplay()
    }
  }, [userChats]);

  useEffect(() => {
    if (chatsToDisplay.length > 0) {
      setIsLoading(false)
    }
    else {
      setIsLoading(true)
    }
  }, [chatsToDisplay])


  const renderUsers = (users) => {
    const res = users.map((user) => {
      return (user.userType == userContext.userType &&
        <View key={user.id} >
          <TouchableOpacity style={styles.userCard} onPress={() => addNewPrivateChat(user)}>
            <Image source={{ uri: user.avatar }} style={{ width: 45, height: 45, borderRadius: 45 }} />
            <Text style={styles.userName}>{user.name}</Text>
          </TouchableOpacity>
          <View style={styles.lineContainer}>
            <View style={styles.line} />
          </View>
        </View>
      )
    }
    )
    setUsersToDisplay(res)
  }

  useEffect(() => {
    const filteredUsers = users.filter(user => user.userType === userContext.userType);
    renderUsers(filteredUsers);
  }, [users]);

  useEffect(() => {
    const filteredUsers = users.filter(user => user.userType === userContext.userType);
    const searchedUsers = filteredUsers.filter((itsearchQueryem) => {
      return itsearchQueryem.name.includes(searchQuery)
    });
    renderUsers(searchedUsers);
  }, [searchQuery]);

  const addNewPrivateChat = async (user) => {
    // check if convo already exists in firestore 
    // if yes, navigate to chat room - if no, add new convo to firestore and navigate to chat room
    const q1 = query(collection(db, auth.currentUser.email), where("Name", "==", auth.currentUser.displayName + "+" + user.name));
    const q2 = query(collection(db, auth.currentUser.email), where("Name", "==", user.name + "+" + auth.currentUser.displayName));
    const querySnapshot = await getDocs(q1);
    const querySnapshot2 = await getDocs(q2);
    if (querySnapshot.docs.length > 0 || querySnapshot2.docs.length > 0) {
      checkifConvoExistsforContact(user)
      if (querySnapshot.docs.length > 0) {
        console.log(querySnapshot.docs[0].data())
        navigation.navigate('ChatRoom', { name: auth.currentUser.displayName + "+" + user.name, UserName: user.name, userEmail: user.id, unreadCount: querySnapshot.docs[0].data().unreadCount, type: "private" })
      }
      else {
        console.log(querySnapshot2.docs[0].data())
        navigation.navigate('ChatRoom', { name: user.name + "+" + auth.currentUser.displayName, UserName: user.name, userEmail: user.id, unreadCount: querySnapshot2.docs[0].data().unreadCount, type: "private" })
      }
      setAddNewModal(false)
      // const editRef= collection(db, auth.currentUser.email, where("Name", "==", auth.currentUser.displayName+"+"+user.name));
      // const doc= await getDocs(editRef);
      // await updateDoc(editRef, { unread: false, unreadCount: 0 });
    } else {
      console.log("add new private chat")
      let contact = user
      console.log("Userrrrr", contact)
      addDoc(collection(db, auth.currentUser.email), { Name: auth.currentUser.displayName + "+" + contact.name, UserName: contact.name, userEmail: contact.id, image: contact.avatar, unread: false, unreadCount: 0, lastMessage: "", lastMessageTime: new Date(), type: "private" });
      checkifConvoExistsforContact(user)
      setAddNewModal(false)
      navigation.navigate('ChatRoom', { name: auth.currentUser.displayName + "+" + contact.name, UserName: contact.name, userEmail: contact.id, unreadCount: 0, type: "private" })
    }
  }

  const checkifConvoExistsforContact = async (contact) => {
    console.log(contact)
    const q1 = query(collection(db, contact.id), where("Name", "==", auth.currentUser.displayName + "+" + contact.name));
    const q2 = query(collection(db, contact.id), where("Name", "==", contact.name + "+" + auth.currentUser.displayName));
    const query1 = await getDocs(q1);
    const query2 = await getDocs(q2);
    if (query1.docs.length > 0 || query2.docs.length > 0) {
      console.log("convo exists for contact")
    } else {
      console.log("add new private chat")
      addDoc(collection(db, contact.id), { Name: auth.currentUser.displayName + "+" + contact.name, UserName: auth.currentUser.displayName, image: auth.currentUser.photoURL, userEmail: auth.currentUser.email, unread: true, unreadCount: 0, lastMessage: "", lastMessageTime: new Date(), type: "private" });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.header}>Chats</Text>
        <TouchableOpacity onPress={() => { setAddNewModal(true) }}>
          <Feather name='edit' size={24} />
        </TouchableOpacity>
      </View>
      {isLoading ? <View style={styles.indicatorView}><ActivityIndicator size="small" color="#548DFF" style={styles.loadIcon} /></View> :
        <ScrollView alwaysBounceVertical={false}>
          {chatsToDisplay}
        </ScrollView>
      }
      <Modal presentationStyle="pageSheet" visible={addNewModal} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.top}>
            <View style={styles.closeBtnContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setAddNewModal(false)}>
                <Ionicons name="ios-close-circle-outline" size={30} style={styles.closeButtonIcon} />
              </TouchableOpacity>
            </View>
            <View style={styles.txtContainer}>
              <Text style={[styles.header, { marginLeft: 0, fontSize: 20 }]}>New Chat</Text>
            </View>
          </View>
          <View style={styles.searchBarContainer}>
            <Searchbar
              placeholder="Search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchBar}
              placeholderTextColor={"#808080"}
            // placeholderStyle={{ fontSize: 14, fontFamily: 'Urbanist-Medium' }}
            />
          </View>
          <ScrollView alwaysBounceVertical={false} style={styles.userScrollView}>
            {usersToDisplay}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const ConvoCard = (props) => {
  const navigation = useNavigation();
  const [lastMessageTime, setLastMessageTime] = useState('')
  const [lastMessageText, setLastMessageText] = useState('')
  const [lastMessageDate, setLastMessageDate] = useState('')
  const today = moment().format('MMM DD ,YYYY')
  const yasterday = moment().subtract(1, 'days').format('MMM DD ,YYYY')

  useEffect(() => {
    const temp = props.name.lastMessageTime.toString().split(' ')
    let date = new moment(props.name.lastMessageTime).format('MMM DD ,YYYY')
    const time = temp[4].split(':').slice(0, 2).join(':')
    setLastMessageTime(time)
    setLastMessageDate(date)
    if (props.name.lastMessage.length > 30) {
      setLastMessageText(props.name.lastMessage.slice(0, 35) + '...')
    }
    else {
      setLastMessageText(props.name.lastMessage)
    }
  }, [props.name]);

  const navigateToChatRoom = async (user) => {
    navigation.navigate('ChatRoom', { name: user.Name, UserName: user.UserName, userEmail: user.userEmail, type: props.name.type, unreadCount: props.name.unreadCount })
    const docRef = query(collection(db, auth.currentUser.email), where("Name", "==", props.name.Name));
    const res = await getDocs(docRef);
    res.forEach((doc) => {
      updateDoc(doc.ref, { unread: false, unreadCount: 0 });
    });
  }

  const deleteChat = async () => {
    console.log("delete chat")
    console.log(props.name.Name)
    const docRef = query(collection(db, auth.currentUser.email), where("Name", "==", props.name.Name));
    const res = await getDocs(docRef);
    res.forEach((doc) => {
      deleteDoc(doc.ref);
    });
    // deleteDoc(doc(db, auth.currentUser.email),where("Name", "==", props.name.Name));
  }

  // fix renderRightActions style- delete button!
  return (
    <>
      <Swipeable
        animationOptions={{
          duration: 1000,
          easing: 'ease-out-cubic',
          delay: 0,
        }}
        dragAnimatedValue={{ x: 100, y: 100 }}
        renderRightActions={() =>
          <TouchableOpacity onPress={() => { deleteChat() }}>
            <View style={styles.deleteIconView}>
              <View style={{ paddingTop: 10 }}>
                <Feather name="trash" size={24} color="#fff" />
              </View>
              <Text style={{ color: "#fff", fontFamily: 'Urbanist-SemiBold', fontSize: 14, marginTop: 5 }}>Trash</Text>
            </View>
          </TouchableOpacity>
        }>
        <View key={props.name.Name} >
          <TouchableOpacity style={styles.conCard} key={props.name.Name} onPress={() => navigateToChatRoom(props.name)} onLongPress={() => { console.log("Long pressed") }}>
            <View style={styles.conLeft}>
              <Image source={{ uri: props.name.image }} style={styles.convoImage} />
            </View>
            <View style={styles.conMiddle}>
              <Text style={styles.conName}>{props.name.UserName ? props.name.UserName : props.name.Name}</Text>
              <Text style={styles.conLastMessage}>{lastMessageText.length >= 20 ? lastMessageText.substring(0, 18) + "..." : lastMessageText}</Text>
            </View>
            <View style={styles.conRight}>
              {props.name.unreadCount > 0 && <View style={styles.unread}>
                <Text style={styles.unreadTxt}>{props.name.unreadCount}</Text>
              </View>}
              {lastMessageDate === today && <Text style={styles.conTime}>{lastMessageTime}</Text>}
              {lastMessageDate === yasterday && <Text style={styles.conDate}>yasterday</Text>}
              {lastMessageDate !== today && lastMessageDate !== yasterday && <Text style={styles.conDate}>{lastMessageDate}</Text>}
            </View>
          </TouchableOpacity>
          <View style={styles.lineContainer}>
            <View style={styles.line} />
          </View>
        </View>
      </Swipeable>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  searchBar: {
    width: ScreenWidth * 0.9,
    height: 54,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#EEEEEE',
    fontFamily: 'Urbanist-Medium',
  },
  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  deleteIconView: {
    backgroundColor: '#FF3C3C',
    justifyContent: 'center',
    alignItems: 'center',
    width: ScreenWidth * 0.2,
    height: ScreenHeight * 0.105,
  },
  closeBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  txtContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conName: {
    fontSize: 20,
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 5,
  },
  conCard: {
    width: ScreenWidth * 0.9,
    height: ScreenHeight * 0.1,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  conMiddle: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: 10,
    width: ScreenWidth * 0.6,
    flex: 9,
  },
  conRight: {
    flex: 4,
    flexDirection: 'column',
    alignItems: 'flex-end',
    alignContent: 'flex-end',
    justifyContent: 'flex-end',
    height: ScreenHeight * 0.1,
  },
  conTime: {
    fontSize: 12,
    fontFamily: 'Urbanist-Regular',
    color: "#808080"
  },
  conDate: {
    fontSize: 12,
    fontFamily: 'Urbanist-Regular',
    color: "#808080"
  },
  lineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: ScreenWidth * 0.9,
    alignSelf: 'center',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#80808080',
    marginVertical: 5,
  },
  conLeft: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  top: {
    width: ScreenWidth * 0.9,
    height: ScreenHeight * 0.1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: {
    fontSize: 24,
    fontFamily: 'Urbanist-Bold',
    color: '#000',
    marginLeft: 10,
  },
  modal: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  userScrollView: {
    flex: 1,
  },
  modalText: {
    fontSize: 24,
    fontFamily: 'Urbanist-Bold',
    color: '#000',
  },
  modalButton: {
    width: ScreenWidth * 0.8,
    height: ScreenHeight * 0.07,
    backgroundColor: '#000',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  modalButtonText: {
    fontSize: 24,
    fontFamily: 'Urbanist-Bold',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Urbanist-Medium',
    color: '#000',
    marginLeft: 10,
  },
  userCard: {
    width: ScreenWidth * 0.9,
    height: ScreenHeight * 0.07,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  unread: {
    borderRadius: 54,
    borderColor: '#000',
    width: 20,
    height: 20,
    padding: 3,
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#548DFF',
    marginBottom: 5,
  },
  unreadTxt: {
    fontSize: 10,
    fontFamily: 'Urbanist-Bold',
    color: '#fff',
  },
  conLastMessage: {
    fontSize: 16,
    fontFamily: 'Urbanist-Regular',
    color: '#808080',
  },
  convoImage: {
    width: 55,
    height: 55,
    borderRadius: 54
  },
  loadIcon: {
    //scale transform: [{ scaleX: 1.5 }, 
    transform: [{ scale: 2 }],
    alignItems: 'center',
    justifyContent: 'center',
    color: '#548DFF',
  },
  indicatorView: {
    justifyContent: 'center',
    alignContent: 'center',
    flex: 1
  }
})