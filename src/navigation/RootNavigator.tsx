import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { WorkoutListScreen } from "@/features/workouts/screens/WorkoutListScreen";
import { WorkoutDetailScreen } from "@/features/workouts/screens/WorkoutDetailScreen";
import { CreateWorkoutScreen } from "@/features/workouts/screens/CreateWorkoutScreen";
import { SessionScreen } from "@/features/sessions/screens/SessionScreen";
import { SessionHistoryScreen } from "@/features/sessions/screens/SessionHistoryScreen";
import { ProgressScreen } from "@/features/progress/screens/ProgressScreen";
import { RemindersScreen } from "@/features/reminders/screens/RemindersScreen";
import { AnalyticsScreen } from "@/features/analytics/screens/AnalyticsScreen";
import { LoginScreen } from "@/features/auth/screens/LoginScreen";
import { RegisterScreen } from "@/features/auth/screens/RegisterScreen";
import { ProfileScreen } from "@/features/auth/screens/ProfileScreen";
import { WeeklyPlanScreen } from "@/features/workouts/screens/WeeklyPlanScreen";
import { SessionDetailScreen } from "@/features/sessions/screens/SessionDetailScreen";
import { THEME as STATIC_THEME, DARK_THEME } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { useSessionActions } from "@/features/sessions/session.store";
import { useAuthStore } from "@/features/auth/auth.store";
import { View, ActivityIndicator, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { EditWorkoutScreen } from "@/features/workouts/screens/EditWorkoutScreen";
import { RootStackParamList } from "./types";
import { useWorkoutActions } from "@/features/workouts/workout.store";
import { SyncService } from "@/services/sync.service";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "help-circle-outline";

          if (route.name === "Library") {
            iconName = focused ? "fitness" : "fitness-outline";
          } else if (route.name === "Schedule") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Analytics") {
            iconName = focused ? "stats-chart" : "stats-chart-outline";
          } else if (route.name === "Progress") {
            iconName = focused ? "camera" : "camera-outline";
          } else if (route.name === "SessionHistory") {
            iconName = focused ? "time" : "time-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontSize: theme.typography.h3.fontSize,
          fontWeight: theme.typography.h3.fontWeight,
        },
      })}
    >
      <Tab.Screen
        name="Library"
        component={WorkoutListScreen}
        options={{ title: "Plans" }}
      />
      <Tab.Screen
        name="Schedule"
        component={WeeklyPlanScreen}
        options={{ title: "Schedule" }}
      />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen
        name="SessionHistory"
        component={SessionHistoryScreen}
        options={{ title: "Record" }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { theme } = useTheme();
  const { hydrateSession } = useSessionActions();
  const {
    initialize,
    checkSession,
    user,
    isLoading: isAuthLoading,
  } = useAuthStore();
  const { loadWorkouts } = useWorkoutActions();

  useEffect(() => {
    const unsubscribe = initialize();
    checkSession();
    hydrateSession();
    return () => unsubscribe();
  }, [initialize, checkSession, hydrateSession]);

  useEffect(() => {
    if (user) {
      loadWorkouts();
      SyncService.pushChanges(user.id);
    }
  }, [user, loadWorkouts]);

  if (isAuthLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme === DARK_THEME,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.action,
        },
        fonts: {
          regular: { fontFamily: "System", fontWeight: "400" },
          medium: { fontFamily: "System", fontWeight: "500" },
          bold: { fontFamily: "System", fontWeight: "700" },
          heavy: { fontFamily: "System", fontWeight: "800" },
        },
      }}
    >
      <StatusBar
        barStyle={theme === DARK_THEME ? "light-content" : "dark-content"}
      />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontSize: theme.typography.h3.fontSize,
            fontWeight: theme.typography.h3.fontWeight,
          },
        }}
      >
        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="WorkoutDetail"
              component={WorkoutDetailScreen}
              options={{ title: "Workout" }}
            />
            <Stack.Screen
              name="CreateWorkout"
              component={CreateWorkoutScreen}
              options={{ title: "New Workout", presentation: "modal" }}
            />
            <Stack.Screen
              name="EditWorkout"
              component={EditWorkoutScreen}
              options={{ title: "Edit Workout", presentation: "modal" }}
            />
            <Stack.Screen
              name="SessionActive"
              component={SessionScreen}
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="SessionDetail"
              component={SessionDetailScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Reminders"
              component={RemindersScreen}
              options={{ title: "Reminders" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
