import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, Dimensions, } from 'react-native'
import React from 'react'
import { useState, useEffect } from 'react'
import Holidays from '../../HelpComponents/Holidays'
import { HaveAccount, OrLine } from '../FooterLine'

const SCREEN_WIDTH = Dimensions.get('window').width;
export default function SignUpUserLVL4({ navigation, route }, props) {
  const [selectedHolidays, setSelectedHolidays] = useState([]);
  const holidaysType = route.params.holidaysType;

  const isItemSelected = (arr) => {
    setSelectedHolidays(arr); //arr is the array of the selected holidays
  };

  const NavigateToNextLVL = () => {
    const tblUser = route.params.userData;
    tblUser.Calendars = selectedHolidays;
    navigation.navigate('SignUpUserLVL5', {
      language: route.params.language,
      tblUser: tblUser
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTxt}>Only Few More Details... </Text>
      </View>

      <View style={styles.holidaysContainer}>
        <Holidays holidaysType={holidaysType} sendHolidays={isItemSelected} />
      </View>
      <TouchableOpacity
        onPress={NavigateToNextLVL}
        style={styles.btnContainer}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>Continue</Text>
        </View>
      </TouchableOpacity>

      <OrLine />
      <HaveAccount />
    </SafeAreaView >
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flex: 0.75,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  headerTxt: {
    marginTop: 30,
    fontFamily: 'Urbanist-Bold',
    fontSize: 28,
    color: '#000',
    textAlign: 'center',
  },
  holidaysContainer: {
    flex: 3,
  },
  btnContainer: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  button: {
    width: SCREEN_WIDTH * 0.95,
    height: 54,
    backgroundColor: '#548DFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    // marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Urbanist-Bold',
    fontSize: 16,
  },
})