import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TaskView from '../HelpComponents/TaskView';
import { AddBtn, NewTaskModal } from '../HelpComponents/AddNewTask';
import { useRoute, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useUserContext } from '../../UserContext';


const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function MainTasks(props) {
  const { allPublicTasks, allPrivateTasks } = useUserContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [allTasks, setAllTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [tommorowTasks, setTommorowTasks] = useState([]);
  const [headerToday, setHeaderToday] = useState(false);
  const [headerTommorow, setHeaderTommorow] = useState(true);
  const arrowIcon = ["chevron-down-outline", "chevron-up-outline"];
  const todayScrollViewRef = useRef(null);
  const tommorowScrollViewRef = useRef(null);
  const route = useRoute();
  const isFocused = useIsFocused();
  const [isFirstFocus, setIsFirstFocus] = useState(true);

  useEffect(() => {
    filterTasks(allPublicTasks, allPrivateTasks);
  }, [allPublicTasks, allPrivateTasks, isFocused]);

  useEffect(() => {
    if (isFocused && route.params) {
      const { task } = route.params;
      let index = todayTasks.findIndex(t => t.actualId === task.actualId);
      if (index == -1) {//that means the task is in tommorow task
        setHeaderTommorow(false);
        setHeaderToday(true);
        index = tommorowTasks.findIndex(t => t.actualId === task.actualId);
        let tommorowTasksLenth = tommorowTasks.length;
        //find the hight that need to scroll to()
        setTimeout(() => {
          scrollToIndex(tommorowScrollViewRef, index, tommorowTasksLenth);

        }, 500);
      }
      else {
        setHeaderTommorow(true);
        setHeaderToday(false);
        let todayTasksLenth = todayTasks.length;
        setTimeout(() => {
          scrollToIndex(todayScrollViewRef, index, todayTasksLenth);
        }, 500);
      }
    }
  }, [isFocused, route.params]);

  useEffect(() => {
    setIsFirstFocus(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus) {
        setIsFirstFocus(false);
      } else {
        todayScrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    }, [isFirstFocus])
  );

  const scrollToIndex = (scrollViewRef, index, lenth) => {
    //sctoll to the task that was pressed, the index is the index of the 
    scrollViewRef.current.scrollTo({
      y: (index / lenth) * SCREEN_HEIGHT,
      animated: true,
    });

  };

  const filterTasks = (privateTask, publicTasks) => {
    //combine private and public tasks for today task and sort by time
    let allTasks = privateTask.concat(publicTasks);
    allTasks.sort((a, b) => (a.TimeInDay > b.TimeInDay ? 1 : -1));
    setAllTasks(allTasks);
    //filter today tasks
    let todayTasks = allTasks.filter(task => {
      let today = new Date();
      let taskDate = new Date(task.taskDate);
      return (
        taskDate.getDate() === today.getDate() &&
        taskDate.getMonth() === today.getMonth() &&
        taskDate.getFullYear() === today.getFullYear()
      );
    });
    if (todayTasks.length === 0) {
      setHeaderToday(true);
    }
    setTodayTasks(todayTasks);
    //filter all task that are not today and not done
    let tommorowTasks = allTasks.filter(task => {
      let today = new Date();
      let taskDate = new Date(task.taskDate);
      return (
        taskDate.getDate() !== today.getDate() ||
        taskDate.getMonth() !== today.getMonth() ||
        taskDate.getFullYear() !== today.getFullYear()
      );
    });
    //sort by date and then by time
    tommorowTasks.sort((a, b) => (a.taskDate > b.taskDate ? 1 : -1));
    if (tommorowTasks.length > 0) {
      setHeaderTommorow(false);
    }
    setTommorowTasks(tommorowTasks);
  };

  const handleAddBtnPress = () => {
    setModalVisible(true);
  };

  const toggleHeaderTodayView = () => {
    if (todayTasks.length === 0) {
      return;
    }
    LayoutAnimation.easeInEaseOut();
    setHeaderToday(!headerToday);
  };

  const toggleHeaderTommorowView = () => {
    LayoutAnimation.easeInEaseOut();
    setHeaderTommorow(!headerTommorow);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.todayView}>
        <View>
          <TouchableOpacity style={styles.headerForTasks} onPress={toggleHeaderTodayView}>
            <Text style={[styles.tasksTitle, todayTasks.length === 0 && { color: '#8B8C8E' }]}>Today</Text>
            <Ionicons name={headerToday ? arrowIcon[0] : arrowIcon[1]} size={30} style={todayTasks.length === 0 ? { color: "#8B8C8E" } : { color: '#548DFF' }} />
          </TouchableOpacity>
        </View>
        <ScrollView alwaysBounceVertical={false} ref={todayScrollViewRef}>
          <View style={[styles.taskList, headerToday ? { display: 'none' } : {}]}>
            {todayTasks.map((task, index) => (
              <TaskView
                today={true}
                key={index}
                task={task}
                isPrivate={task.patientId == null ? true : false}
                hideDate={true}
                onLayout={() => scrollToIndex(todayScrollViewRef, index)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={[styles.TommorowView, headerToday ? { flex: 33 } : {}]}>
        <View>
          <TouchableOpacity style={styles.headerForTasks} onPress={toggleHeaderTommorowView}>
            <Text style={styles.tasksTitle}>Upcoming</Text>
            <Ionicons name={headerTommorow ? arrowIcon[0] : arrowIcon[1]} size={30} color="#548DFF" />
          </TouchableOpacity>
        </View>
        <ScrollView alwaysBounceVertical={false} ref={tommorowScrollViewRef}>
          <View style={[styles.taskList, headerTommorow ? { display: 'none' } : {}]}>
            {tommorowTasks.map((task, index) => (
              <TaskView
                today={false}
                key={index}
                task={task}
                isPrivate={task.patientId == null ? true : false}
                hideDate={false}
                onLayout={() => scrollToIndex(tommorowScrollViewRef, index)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={styles.addBtnView}>
        <AddBtn onPress={handleAddBtnPress} />
      </View>
      <NewTaskModal isVisible={modalVisible} onClose={handleModalClose} cancel={() => { setModalVisible(false) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  todayView: {
    flex: 3.6,
    width: '100%',
    marginBottom: 20,
  },
  TommorowView: {
    flex: 1.25,
    width: '100%',
    marginTop: 10
  },
  addBtnView: {
    position: 'absolute',
    bottom: 20,
    right: 10,
  },
  headerForTasks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: 15,
    marginRight: SCREEN_WIDTH * 0.035,
  },
  tasksTitle: {
    fontSize: 24,
    fontFamily: 'Urbanist-Bold',
    color: '#000',
  },
  taskList: {
    marginTop: 10,
  },
});
