import { View, Text, Alert, SafeAreaView, TouchableOpacity, Dimensions, StyleSheet, Platform } from 'react-native'
import { useEffect, useState } from 'react'
import { FontAwesome, Entypo, MaterialIcons } from '@expo/vector-icons';
import DatePicker from 'react-native-datepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { OrLine, HaveAccount } from '../FooterLine';
import DateTimePicker from '@react-native-community/datetimepicker';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SignUpCaregiverLVL4({ navigation, route }) {
  const [language, setLanguage] = useState(route.params.language);
  const [country, setCountry] = useState(route.params.country);
  const [holidaysType, setHolidaysType] = useState(route.params.holidaysType);
  const userData = route.params.userData;
  const [platfr, setPlatfr] = useState(Platform.OS);
  const [showPickerAndroidBD, setShowPickerAndroidBD] = useState(false);
  const [showPickerAndroidVE, setShowPickerAndroidVE] = useState(false);

  //for date picker android
  // birth date
  const showDatepickerBD = () => {
    // showMode('date');
    console.log('show date picker');
    setShowPickerAndroidBD(!showPickerAndroidBD);
  };

  const onChangeDateBD = (selectedDate) => {
    console.log('date changed');
    const birthDate = new Date(selectedDate.nativeEvent.timestamp).toISOString().substring(0, 10);
    console.log(birthDate, "birthDate");
    console.log(date, "date");
    if (birthDate !== '1980-01-01') { setDate(birthDate); }
    setShowPickerAndroidBD(!showPickerAndroidBD);
  };

  // visa expiration
  const showDatepickerVE = () => {
    // showMode('date');
    console.log('show date picker');
    setShowPickerAndroidVE(!showPickerAndroidVE);
  };

  const onChangeDateVE = (selectedDate) => {
    setVisaExpiration(new Date(selectedDate.nativeEvent.timestamp).toISOString().substring(0, 10));
    setShowPickerAndroidVE(!showPickerAndroidVE);
  };

  useEffect(() => {
    console.log(visaExpiration, "visaExpiration");
  }, [visaExpiration])

  const getMinDate = () => {
    var date = new Date().getDate(); //Current Date
    var month = new Date().getMonth() + 1; //Current Month
    var year = new Date().getFullYear(); //Current Year
    return year + '-' + month + '-' + date;
  }
  const getMaxDate = () => {
    var date = new Date().getDate(); //Current Date
    var month = new Date().getMonth() + 1; //Current Month
    var year = new Date().getFullYear() + 20; //Current Year
    return year + '-' + month + '-' + date;
  }

  const [visaExpiration, setVisaExpiration] = useState('');
  const [date, setDate] = useState('');


  const [openCountry, setOpenCountry] = useState(false);
  const [valueCountry, setValueCountry] = useState(null);

  const [openLanguage, setOpenLanguage] = useState(false);
  const [valueLanguage, setValueLanguage] = useState(null);

  // send this data to next screen (SignUpCaregiverLVL5)
  const NavigateToNextScreen = () => {
    if (valueCountry == null) {
      Alert.alert("Please fill all the details");
    }
    else {
      const newUser = {
        FirstName: userData.FirstName,
        LastName: userData.LastName,
        Email: userData.Email,
        Password: userData.Password,
        gender: userData.gender,
        phoneNum: userData.phoneNum,
        userUri: userData.userUri,
      }

      //Foreign User Data
      const newForeignUserData = {
        CountryName_En: valueCountry,
        LanguageName_En: valueLanguage,
        dateOfBirth: new Date(date),
        visaExpirationDate: new Date(visaExpiration),
      };
      navigation.navigate("SignUpCaregiverLVL5", { newForeignUserData: newForeignUserData, newUser: newUser, holidaysType: holidaysType, patientId: route.params.patientId });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Text */}
      <View style={styles.headerContainer}><Text style={styles.header}>Only few more details...</Text></View>

      {/* Input Container */}
      <View style={styles.inputContainer}>
        {/* Date Picker for birth-date */}
        {platfr !== 'ios' ? <TouchableOpacity style={styles.datePicker} onPress={showDatepickerBD}>
          <Text style={styles.dateInputTxt}>
            {date === '' ? 'Date Of Birth' : date}
          </Text>
          {!date && <FontAwesome name="calendar-check-o" size={24} color="gray" />}
          {/* <Octicons style={{ textAlign: 'right' }} name="calendar" size={22} /> */}
        </TouchableOpacity> :
          <DatePicker
            useNativeDriver={true}
            iconComponent={<FontAwesome name="calendar-check-o" size={24} color="gray" />}
            style={styles.input}
            date={date}
            mode="date"
            placeholder="Date Of Birth"
            format="YYYY-MM-DD"
            minDate="1940-01-01"
            maxDate="2001-01-01"
            confirmBtnText="Confirm"
            cancelBtnText="Cancel"
            customStyles={{
              dateIcon: {
                position: 'absolute',
                right: 0,
                top: 0,
                marginLeft: 0.2
              },
              dateInput: {
                marginLeft: 0,
                alignItems: 'flex-start',
                borderWidth: 0,
              },
              placeholderText: {
                color: 'gray',
                fontFamily: 'Urbanist-Medium',
                fontSize: 16
              }
            }}
            onDateChange={(date) => { setDate(date) }}
          />}
        {showPickerAndroidBD && (
          <DateTimePicker
            //testID="dateTimePicker"
            value={new Date('1980-01-01')}
            // mode={"date"}
            is24Hour={true}
            onChange={(date) => onChangeDateBD(date)}
            display="default"
            maximumDate={new Date()}
            minimumDate={new Date('1920-01-01')}
          />
        )}
      </View>

      {/* Input Container */}
      <View style={styles.inputContainer}>
        {/* Date Picker for visa expiration min date should be today*/}
        {platfr !== 'ios' ? <TouchableOpacity style={styles.datePicker} onPress={showDatepickerVE}>
          <Text style={styles.dateInputTxt}>
            {visaExpiration === '' ? 'Visa Expiration' : visaExpiration}
          </Text>
          {!visaExpiration && <FontAwesome name="calendar-times-o" size={24} color="gray" />}
          {/* <Octicons style={{ textAlign: 'right' }} name="calendar" size={22} /> */}
        </TouchableOpacity> :
          <DatePicker
            iconComponent={<FontAwesome name="calendar-times-o" size={24} color="gray" />}
            useNativeDriver={true}
            style={styles.input}
            date={visaExpiration}
            mode="date"
            placeholder="Visa Expiration"
            format="YYYY-MM-DD"
            minDate={getMinDate()}
            maxDate={getMaxDate()}
            confirmBtnText="Confirm"
            cancelBtnText="Cancel"
            customStyles={{
              dateIcon: {
                position: 'absolute',
                right: 0,
                top: 0,
              },
              dateInput: {
                marginLeft: 0,
                alignItems: 'flex-start',
                borderWidth: 0,
              },
              placeholderText: {
                color: 'gray',
                fontFamily: 'Urbanist-Medium',
                fontSize: 16
              }
            }}
            onDateChange={(date) => { setVisaExpiration(date) }}
          />}
        {showPickerAndroidVE && (
          <DateTimePicker
            //testID="dateTimePicker"
            value={visaExpiration ? new Date(visaExpiration) : new Date()}
            // mode={"date"}
            is24Hour={true}
            onChange={(date) => onChangeDateVE(date)}
            display="default"
            minimumDate={new Date()}
          />
        )}
      </View>

      {/* Drop Down Picker for Country */}
      <View style={styles.listContainer}>
        <Dropdown
          style={styles.dropdown}
          placeholder="Select Country"
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={country}
          search={true}
          maxHeight={300}
          labelField="label"
          valueField="value"
          searchPlaceholder="Search..."
          value={valueCountry}
          onChange={item => {
            setValueCountry(item.label);
          }}
          renderRightIcon={() => (
            <Entypo name={'location'} color={'gray'} size={24} />
          )}
          containerStyle={styles.containerStyle}
        />
      </View>

      {/* Drop Down Picker for Language */}
      <View style={styles.listContainer}>
        <Dropdown
          style={styles.dropdown}
          placeholder="Select Language"
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={language}
          search={true}
          maxHeight={300}
          labelField="label"
          valueField="value"
          searchPlaceholder="Search..."
          value={valueLanguage}
          onChange={item => { setValueLanguage(item.value); }}
          renderRightIcon={() => (<MaterialIcons name="translate" size={24} color="gray" />)}
          containerStyle={styles.containerStyle}
        />
      </View>

      {/* Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          // if the drop down picker is open then display none the button
          style={[styles.button, { display: openCountry || openLanguage ? 'none' : 'flex' }]}
          onPress={NavigateToNextScreen}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      <OrLine />
      <HaveAccount />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  containerStyle: {
    justifyContent: 'flex-start',
    borderRadius: 16,
  },
  dropdown: {
    padding: 16,
    height: 54,
    borderColor: '#E6EBF2',
    borderWidth: 1.5,
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.9,
    marginVertical: 10,
  },
  placeholderStyle: {
    fontSize: 16,
    width: SCREEN_WIDTH * 0.9,
    fontFamily: 'Urbanist-Medium',
    color: 'gray',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: 'gray',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    width: SCREEN_WIDTH * 0.8,
    fontSize: 16,
    fontFamily: 'Urbanist-Regular',
    borderRadius: 16,
    color: 'gray',
  },
  header: {
    fontSize: 30,
    fontFamily: 'Urbanist-Bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  headerContainer: {
    alignItems: 'flex-start',
    // how to align the text for android
    justifyContent: 'center',
    flex: 1
  },
  inputContainer: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    flex: 0.35,
    marginVertical: 10,
  },
  buttonContainer: {
    width: SCREEN_WIDTH * 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    flex: 1
  },
  button: {
    width: SCREEN_WIDTH * 0.9,
    height: 54,
    backgroundColor: '#548DFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    zIndex: 1000,
    zIndexInverse: 3000,
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
  listContainer: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    flex: 0.35,
    marginVertical: 10,
  },
  input: {
    width: SCREEN_WIDTH * 0.9,
    height: 54,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Urbanist-Medium',
    color: 'gray',
    borderColor: '#E6EBF2',
    borderWidth: 1.5,
    justifyContent: 'center',
    marginVertical: 10,
  },
  datePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.9,
    height: 54,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Urbanist-Medium',
    color: 'gray',
    borderColor: '#E6EBF2',
    borderWidth: 1.5,
    marginVertical: 10,
  },
  dateInputTxt: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Urbanist-Medium',
    fontSize: 16,
    color: 'gray',
  },
})