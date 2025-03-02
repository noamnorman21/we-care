import { View, Text, StyleSheet, SafeAreaView, Dimensions, BackHandler, Alert } from 'react-native';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import TaskView from './HelpComponents/TaskView';
import { useUserContext } from '../UserContext';
import { AddBtn, NewTaskModal } from './HelpComponents/AddNewTask';
import { Fontisto, FontAwesome5 } from '@expo/vector-icons';
import { Agenda, CalendarProvider } from 'react-native-calendars';
import moment from 'moment';
import { useFocusEffect, useIsFocused, StackActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Home({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const { allPublicTasks, allPrivateTasks, holidays, logOutFireBase, userContext, GetUserHistory, GetUserPending, GetNotificationsThatSent } = useUserContext();
  const isFocused = useIsFocused();
  const firstName = userContext.FirstName;
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(userContext);
  }, [userContext]);

useEffect(() => {
  let listener= Notifications.addNotificationReceivedListener((notification) => {
    let notiBody= notification.request.content.body
    if (notiBody.includes("message")) {
      console.log("message");
      setNewMessages(newMessages + 1);
    }
    else if (notiBody.includes("task")) {
      console.log("task")
    }
    else if (notiBody.includes("payment")) {
      console.log(user)
      GetUserPending(user)
      // GetUserHistory(user)
    }
    GetNotificationsThatSent(user.userId);
});

listener;
    return () => {
      console.log("remove listener")
        Notifications.removeNotificationSubscription(listener);
    };
}, [user]);

  useEffect(() => {
    let listener = Notifications.addNotificationReceivedListener((notification) => {
      let notiBody = notification.request.content.body
      if (notiBody.includes("message")) {
        setNewMessages(newMessages + 1);
      }
      else if (notiBody.includes("task")) {
      }
      else if (notiBody.includes("payment")) {
        GetUserPending()
        GetUserHistory()
      }
      GetNotificationsThatSent(userContext.userId);
    });

    listener;
    return () => {
      Notifications.removeNotificationSubscription(listener);
    };
  }, []);


  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Exit App', 'Do you want to exit?', [
          { text: 'No', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
          {
            text: 'Yes', onPress: () => {
              AsyncStorage.removeItem("user");
              AsyncStorage.removeItem("userData");
              logOutFireBase()
              navigation.popToTop()
            }
          },
        ], { cancelable: false });
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  const allTasks = useMemo(() => {
    return filterTasks(allPrivateTasks, allPublicTasks);
  }, [allPrivateTasks, allPublicTasks]);

  const agendaItems = useMemo(() => {
    const items = {};
    holidays.forEach((holiday) => {
      const date = moment(holiday.date).format('YYYY-MM-DD');
      if (!items[date]) {
        items[date] = [];
      }
      items[date].push({ name: holiday.name, desc: holiday.desc });
    });

    allTasks.forEach((task) => {
      let today = false;
      const taskDate = moment(task.taskDate).format('YYYY-MM-DD');
      const todayDate = moment().format('YYYY-MM-DD');
      if (taskDate === todayDate) {
        today = true;
      }
      let isPrivate = false;
      if (task.patientId == null) {
        isPrivate = true;
      }
      if (!items[taskDate]) {
        items[taskDate] = [];
      }
      items[taskDate].push({ task, isPrivate, today, key: task.actualId });
    });

    return items;
  }, [allTasks, holidays]);

  useEffect(() => {
    if (isFocused) {
      filterTasks(allPrivateTasks, allPublicTasks);
    }
  }, [allPrivateTasks, allPublicTasks, isFocused]);

  function filterTasks(privateTask, publicTasks) {
    const allTasks = privateTask.concat(publicTasks);
    allTasks.sort((a, b) => {
      return a.TimeInDay > b.TimeInDay ? 1 : -1;
    });
    return allTasks;
  }

  const handleAddBtnPress = () => {
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.calendarContainer}>
        <CalendarProvider>
          <Agenda
            futureScrollRange={12}
            pastScrollRange={12}
            showOnlySelectedDayItems={true}
            refreshing={false}
            showClosingKnob={true}
            renderEmptyData={() => (
              <View>
                <Text style={styles.emptyDataText}>
                  There are no holidays or tasks today...
                </Text>
              </View>
            )}
            items={agendaItems}
            renderItem={(item) => {
              {
                if (item.key == null) {
                  return (
                    <View style={styles.item}>
                      <View>
                      <View style={styles.itemTitle}>
                        <View style={styles.iconContainer}>
                          <View style={styles.icon}>
                            <FontAwesome5 name="umbrella-beach" size={22} color="#32D081" />
                          </View>
                        </View>          
                        <View style={styles.taskDetails}>
                        <Text style={styles.itemTitleTxt}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemText}>
                          {item.desc}
                        </Text>
                      </View>
                      </View>
                      </View>
                      
                     
                      <View style={styles.taskComment}>
                        {/* <Text style={styles.itemText}>
                          {item.desc}
                        </Text> */}
                      </View>
                      <View style={styles.line} />
                    </View>
                  )
                }
                else {
                  return (
                    <TaskView today={item.today} key={item.key} task={item.task} isPrivate={item.isPrivate} hideDate={true} />
                  )
                }
              }
            }}

            renderDay={(day, item) => { return <View />; }}
            rowHasChanged={(r1, r2) => { return r1.text !== r2.text; }}
          />
        </CalendarProvider>
      </View >
      <View style={styles.addBtnView}>
        <AddBtn onPress={handleAddBtnPress} />
      </View>
      <NewTaskModal isVisible={modalVisible} onClose={handleModalClose} cancel={() => { setModalVisible(false) }} />
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  addBtnView: {
    position: 'absolute',
    bottom: 20,
    right: 10,
  },
  calendarContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  emptyDataText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Urbanist-Medium',
  },
  item: {
    flex: 1,
    width: SCREEN_WIDTH,
    flexDirection: 'column',
    height: 'auto',
    minHeight: 75,
    marginVertical: 7,
  },
  iconContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%',
  },
  icon: {
    borderRadius: 54,
    height: 54,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCEFAB',
  },
  itemTitle: {
    flex: 1,
    width: SCREEN_WIDTH * 0.95,
    flexDirection: 'row',
  },
  itemTitleTxt: {
    fontSize: 18,
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 5,
    textAlign: 'left',
    color: '#000',
  },
  itemText: {
    fontSize: 16,
    fontFamily: 'Urbanist-Regular',
    color: '#000',
    marginVertical: 7,
  },
  taskComment: {
    flex: 1.5,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: SCREEN_WIDTH * 0.9,
    paddingLeft: 30,
  },
  line: {
    width: SCREEN_WIDTH,
    height: 0.75,
    backgroundColor: '#808080',
    opacity: 0.5,
    marginTop: 7,
  },
  taskDetails: {
    flex: 5,
    height: '100%',
  },
});
