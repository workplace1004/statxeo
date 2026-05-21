import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Text, View } from "react-native";

import { useAuth } from "../state/auth-context";
import { ClientsScreen } from "../screens/clients-screen";
import { HomeScreen } from "../screens/home-screen";
import { ProfileScreen } from "../screens/profile-screen";
import { SignInScreen } from "../screens/sign-in-screen";
import { SignUpScreen } from "../screens/sign-up-screen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function AppTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Clients" component={ClientsScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#020617", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <ActivityIndicator color="#38bdf8" />
      <Text style={{ color: "#e2e8f0" }}>Loading Statxeo Mobile...</Text>
    </View>
  );
}

export function RootNavigator() {
  const { loading, session } = useAuth();

  if (loading) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#020617" },
          animation: "fade",
        }}
      >
        {session ? (
          <Stack.Screen name="AppTabs" component={AppTabs} />
        ) : (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ animation: "slide_from_right", presentation: "card" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
