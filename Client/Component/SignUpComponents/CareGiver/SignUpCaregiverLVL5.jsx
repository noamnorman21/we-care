import { View, Text, SafeAreaView, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Alert } from 'react-native'
import * as Linking from 'expo-linking';
import { useState, useEffect } from 'react'
import Holidays from '../../HelpComponents/Holidays';
import { auth, db } from '../../../config/firebase'
import { collection, addDoc, query } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useUserContext } from '../../../UserContext';
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { where, getDocs, updateDoc } from "firebase/firestore";
import * as Notifications from 'expo-notifications';

const groupImage = 'https://firebasestorage.googleapis.com/v0/b/worcare-3df72.appspot.com/o/groupPics%2FCrowd.png?alt=media&token=b7e7a4ef-ba86-4f3b-9ba8-e032dfed204f'

const SCREEN_WIDTH = Dimensions.get('window').width;
export default function SignUpCaregiverLVL5({ navigation, route }) {
  const [selectedHolidays, setSelectedHolidays] = useState([]);
  const newForeignUserData = route.params.newForeignUserData;
  const newUser = route.params.newUser;
  const holidaysType = route.params.holidaysType;
  const [linkTo, setLinkTo] = useState("");
  const { registerForPushNotificationsAsync, routeEmail } = useUserContext();
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    getInitialUrl();
  }, []);

  const getInitialUrl = async () => {
    setLinkTo(await Linking.getInitialURL());
    console.log("link:", linkTo);
    console.log("email:", routeEmail);
  }

  useEffect(() => {
    console.log(routeEmail);
  }, [routeEmail]);

  const getPush = async () => {
 
      const currentToken = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(currentToken);
      setExpoPushToken(currentToken);
      return currentToken;
  }

  //updated for chat
  const createUserInDB = async () => {
    let res= await getPush();
    if (res == null||res==""||res==undefined||res=='') {
      newUser.pushToken = expoPushToken;
    }
    else {
      newUser.pushToken = res;
    }
    newUser.Calendars = selectedHolidays;
    console.log("new user:", newUser);

    //selectedHolidays is the array of the selected holidays,use them in data base with stored procedure "InsertCalendarForUser"        
    fetch('https://proj.ruppin.ac.il/cgroup94/test1/api/User/InsertUser', { //send the user data to the DB
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(newUser),
    })
      .then((response) => response.json())
      .then((json) => {
        let userToUpdate = {
          id: newUser.Email,
          name: newUser.FirstName + " " + newUser.LastName, //the name of the user is the first name and the last name
          avatar: newUser.userUri
        }
        console.log(newUser);
        createUserWithEmailAndPassword(auth, newUser.Email, newUser.Password)
          .then(() => {
            //add the new user and paired user to each other's chat
            signInWithEmailAndPassword(auth, newUser.Email, newUser.Password).then((userCredential) => {
              console.log("user signed in");
              updateProfile(auth.currentUser, {
                displayName: newUser.FirstName + ' ' + newUser.LastName,
                photoURL: newUser.userUri
              }).then(async () => {
                let userToUpdate = {
                  id: auth.currentUser.email,
                  name: auth.currentUser.displayName, //the name of the user is the first name and the last name
                  avatar: auth.currentUser.photoURL
                }
                await addDoc(collection(db, "AllUsers"), { id: userToUpdate.id, name: userToUpdate.name, avatar: userToUpdate.avatar, userType: "Caregiver" }).then(async () => {
                  const q = query(collection(db, "GroupMembers"), where("Name", "==", newForeignUserData.CountryName_En));
                  const querySnapshot = await getDocs(q);
                  // check if the group already exists, if not add it to the db
                  if (querySnapshot.empty) {
                    console.log("No matching documents.");
                    console.log(newForeignUserData.CountryName_En);
                    await addDoc(collection(db, "GroupMembers"), { Name: newForeignUserData.CountryName_En, userEmail: [newUser.Email] });
                  }
                  else {
                    querySnapshot.forEach((doc) => {
                      console.log(doc.id, " => ", doc.data());
                      updateDoc(doc.ref, {
                        userEmail: [...doc.data().userEmail, newUser.Email]
                      });
                    });
                  }
                  await addDoc(collection(db, auth.currentUser.email), { Name: newForeignUserData.CountryName_En, UserName: "", userEmail: "", image: groupImage, unread: false, unreadCount: 0, lastMessage: "", lastMessageTime: new Date(), type: "group" }).then(async () => {
                    console.log("group added to user");
                    let userQuery = query(collection(db, "AllUsers"), where("id", "==", routeEmail));
                    let userQuerySnapshot = await getDocs(userQuery);
                    let user = {
                      id: userQuerySnapshot.docs[0].data().id,
                      name: userQuerySnapshot.docs[0].data().name,
                      avatar: userQuerySnapshot.docs[0].data().avatar,
                      userType: userQuerySnapshot.docs[0].data().userType
                    }
                    await addDoc(collection(db, auth.currentUser.email), { Name: auth.currentUser.displayName + "+" + user.name, UserName: user.name, userEmail: user.id, image: user.avatar, unread: false, unreadCount: 0, lastMessage: "", lastMessageTime: new Date(), type: "private" });
                    await addDoc(collection(db, user.id), { Name: auth.currentUser.displayName + "+" + user.name, UserName: auth.currentUser.displayName, userEmail: auth.currentUser.email, image: auth.currentUser.photoURL, unread: false, unreadCount: 0, lastMessage: "", lastMessageTime: new Date(), type: "private" });
                    //delete when published to filezila
                    signOut(auth).then(() => {
                      console.log("user signed out");
                    }).catch((error) => {
                    });
                  })
                    .catch((error) => {
                      console.error(error);
                    }
                    );
                })
                  .catch((error) => {
                    console.error(error);
                  }
                  );
              })
                .catch((error) => {
                  console.error(error);
                }
                );
            })
          })
          .catch((error) => {
            console.error(error);
          }
          );
        //save the id of the new user that we got from the DB 
        newForeignUserData.Id = json; //save the id of the new user that we got from the DB
        console.log(newForeignUserData.Id);
        createForeignUserInDB() //create the foreign user in the DB
      })
      .catch((error) => {
        console.error(error);
      }
      );
  };

  const createForeignUserInDB = () => {
    console.log(newForeignUserData);
    fetch('https://proj.ruppin.ac.il/cgroup94/test1/api/ForeignUser/InsertForeignUser', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newForeignUserData),
    })
      .then((response) => response.json())
      .then((json) => {
        console.log(json);
        InsertCaresForPatient();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  //updated for chat
  const InsertCaresForPatient = () => {
    const caresForPatient = {
      patientId: route.params.patientId,
      workerId: newForeignUserData.Id,
      linkTo: linkTo,
      status: "P"
    };
    fetch('https://proj.ruppin.ac.il/cgroup94/test1/api/ForeignUser/InsertCaresForPatient', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(caresForPatient),
    })
      .then(async () => {
        //console.log(json);
        Alert.alert("Great Job !", "You can login now", [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate('LogIn');
              //we will add to this stage a notification to the user that a new caregiver was added to his care team, and he will approve it
            }
          }
        ]);
      })
      .catch((error) => {
        console.error("error from cares for patient:");
        console.error(error.message);
      });
  };

  const isItemSelected = (arr) => {
    setSelectedHolidays(arr); //arr is the array of the selected holidays
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTxt}>Great Job !</Text>
      </View>
      <Holidays holidaysType={holidaysType} sendHolidays={isItemSelected} />
      <View style={styles.btnContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={createUserInDB}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <View style={styles.legalTextContainer}>
          <Text style={styles.legalText}>
            By signing up {" "}
            <Text style={styles.legalTextLink}>worCare</Text>
            <Text style={styles.legalText}>, you agree to our </Text>
            <Text style={styles.legalTextLink}>Terms Of Service</Text>{" "}
            <Text style={styles.legalText}>and</Text>{" "}
            <Text style={styles.legalTextLink}>Privacy Policy</Text>{" "}
          </Text>
        </View>
      </View>

    </SafeAreaView >
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTxt: {
    fontFamily: 'Urbanist-Bold',
    fontSize: 30,
    color: '#000',
    textAlign: 'center',
  },
  headerSmallTxt: {
    fontFamily: 'Urbanist-SemiBold',
    fontSize: 20,
    color: '#000',
    textAlign: 'center',
    marginVertical: 10,
  },
  line: {
    borderBottomColor: '#808080',
    borderBottomWidth: 0.5,
    marginVertical: 20,
  },
  bodyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  itemBox: {
    width: SCREEN_WIDTH * 0.45,
    height: 45,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E6EBF2',
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    fontFamily: 'Urbanist-Medium',
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  btnContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: SCREEN_WIDTH * 0.9,
    height: 54,
    backgroundColor: '#548DFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedItem: {
    borderColor: "#548DFF",
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Urbanist-Bold',
    fontSize: 16,
  },
  legalTextContainer: {
    marginBottom: 10,
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 35,
  },
  legalText: {
    fontFamily: 'Urbanist',
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
  },
  legalTextLink: {
    fontFamily: 'Urbanist-SemiBold',
    fontSize: 14,
    color: '#548DFF',
  },
});