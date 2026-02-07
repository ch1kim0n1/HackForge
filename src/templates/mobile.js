// Mobile app templates

function reactNative(config) {
  return {
    packageJson: {
      name: config.projectName,
      version: "1.0.0",
      main: "node_modules/expo/AppEntry.js",
      scripts: {
        start: "expo start",
        android: "expo start --android",
        ios: "expo start --ios",
        web: "expo start --web"
      },
      dependencies: {
        "expo": "~49.0.0",
        "expo-status-bar": "~1.6.0",
        "react": "18.2.0",
        "react-native": "0.72.6"
      },
      devDependencies: {
        "@babel/core": "^7.20.0"
      }
    },
    files: {
      'App.js': `import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ScrollView } from 'react-native';
import { useState } from 'react';

export default function App() {
  const [counter, setCounter] = useState(0);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>🔨 ${config.projectName}</Text>
        <Text style={styles.subtitle}>${config.projectDescription}</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Counter Example</Text>
          <Text style={styles.counter}>{counter}</Text>
          <View style={styles.buttonContainer}>
            <Button title="Increment" onPress={() => setCounter(counter + 1)} />
            <Button title="Decrement" onPress={() => setCounter(counter - 1)} color="#ff6b6b" />
            <Button title="Reset" onPress={() => setCounter(0)} color="#868e96" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Get Started</Text>
          <Text style={styles.text}>Edit App.js to start building your mobile app!</Text>
          <Text style={styles.text}>• Run on Android: npm run android</Text>
          <Text style={styles.text}>• Run on iOS: npm run ios</Text>
          <Text style={styles.text}>• Run on Web: npm run web</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 15,
  },
  counter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#667eea',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 10,
  },
  text: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
});`,
      'app.json': JSON.stringify({
        expo: {
          name: config.projectName,
          slug: config.projectName,
          version: "1.0.0",
          orientation: "portrait",
          icon: "./assets/icon.png",
          splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
          },
          updates: {
            fallbackToCacheTimeout: 0
          },
          assetBundlePatterns: [
            "**/*"
          ],
          ios: {
            supportsTablet: true
          },
          android: {
            adaptiveIcon: {
              foregroundImage: "./assets/adaptive-icon.png",
              backgroundColor: "#FFFFFF"
            }
          },
          web: {
            favicon: "./assets/favicon.png"
          }
        }
      }, null, 2),
      '.gitignore': `node_modules/
.expo/
dist/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/`
    }
  };
}

function flutter(config) {
  return {
    files: {
      'pubspec.yaml': `name: ${config.projectName.replace(/-/g, '_')}
description: ${config.projectDescription}
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0

flutter:
  uses-material-design: true`,
      'lib/main.dart': `import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${config.projectName}',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: '${config.projectName}'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() {
      _counter++;
    });
  }

  void _decrementCounter() {
    setState(() {
      _counter--;
    });
  }

  void _resetCounter() {
    setState(() {
      _counter = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Card(
              margin: const EdgeInsets.all(20),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const Text(
                      '🔨 ${config.projectName}',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      '${config.projectDescription}',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            Card(
              margin: const EdgeInsets.all(20),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const Text(
                      'Counter Example',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      '$_counter',
                      style: Theme.of(context).textTheme.headlineLarge,
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        ElevatedButton(
                          onPressed: _incrementCounter,
                          child: const Text('Increment'),
                        ),
                        ElevatedButton(
                          onPressed: _decrementCounter,
                          child: const Text('Decrement'),
                        ),
                        ElevatedButton(
                          onPressed: _resetCounter,
                          child: const Text('Reset'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}`,
      'README.md': `# ${config.projectName}

${config.projectDescription}

## Getting Started

### Prerequisites
- Flutter SDK 3.0+

### Run the app
\`\`\`bash
flutter run
\`\`\`

### Build for production
\`\`\`bash
# Android
flutter build apk

# iOS
flutter build ios
\`\`\`
`,
      '.gitignore': `.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
build/`
    }
  };
}

function swiftIOS(config) {
  const appName = config.projectName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  
  return {
    files: {
      'ContentView.swift': `import SwiftUI

struct ContentView: View {
    @State private var counter = 0
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("🔨 ${config.projectName}")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("${config.projectDescription}")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                    .padding()
                
                VStack(spacing: 15) {
                    Text("Counter Example")
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text("\\(counter)")
                        .font(.system(size: 72, weight: .bold))
                        .foregroundColor(.purple)
                    
                    HStack(spacing: 15) {
                        Button(action: { counter += 1 }) {
                            Text("Increment")
                                .frame(width: 100)
                        }
                        .buttonStyle(.borderedProminent)
                        
                        Button(action: { counter -= 1 }) {
                            Text("Decrement")
                                .frame(width: 100)
                        }
                        .buttonStyle(.bordered)
                        
                        Button(action: { counter = 0 }) {
                            Text("Reset")
                                .frame(width: 100)
                        }
                        .buttonStyle(.bordered)
                        .tint(.gray)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(15)
                
                Spacer()
            }
            .padding()
            .navigationTitle("${appName}")
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}`,
      'App.swift': `import SwiftUI

@main
struct ${appName}App: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}`,
      'README.md': `# ${config.projectName}

${config.projectDescription}

## Getting Started

### Prerequisites
- Xcode 14+
- macOS Ventura or later

### Run the app
1. Open \`${appName}.xcodeproj\` in Xcode
2. Select a simulator or device
3. Press Cmd+R to run

### Build for App Store
1. Select "Any iOS Device" as the destination
2. Product > Archive
3. Follow the Organizer to upload to App Store Connect
`,
      '.gitignore': `# Xcode
build/
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata/
*.moved-aside
*.xccheckout
*.xcscmblueprint
DerivedData/`
    }
  };
}

function kotlinAndroid(config) {
  const packageName = `com.${config.projectName.replace(/-/g, '')}`;
  
  return {
    files: {
      'app/build.gradle': `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace '${packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${packageName}"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    buildFeatures {
        compose true
    }

    composeOptions {
        kotlinCompilerExtensionVersion '1.5.1'
    }

    kotlinOptions {
        jvmTarget = '1.8'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.6.2'
    implementation 'androidx.activity:activity-compose:1.8.0'
    implementation platform('androidx.compose:compose-bom:2023.10.01')
    implementation 'androidx.compose.ui:ui'
    implementation 'androidx.compose.ui:ui-graphics'
    implementation 'androidx.compose.ui:ui-tooling-preview'
    implementation 'androidx.compose.material3:material3'
}`,
      'app/src/main/AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${config.projectName}"
        android:theme="@style/Theme.AppCompat.Light">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
      'app/src/main/java/MainActivity.kt': `package ${packageName}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    CounterScreen()
                }
            }
        }
    }
}

@Composable
fun CounterScreen() {
    var counter by remember { mutableStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "🔨 ${config.projectName}",
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "${config.projectDescription}",
            fontSize = 16.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Card(
            modifier = Modifier.padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Counter Example",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = counter.toString(),
                    fontSize = 72.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(onClick = { counter++ }) {
                        Text("Increment")
                    }
                    Button(onClick = { counter-- }) {
                        Text("Decrement")
                    }
                    Button(onClick = { counter = 0 }) {
                        Text("Reset")
                    }
                }
            }
        }
    }
}`,
      'README.md': `# ${config.projectName}

${config.projectDescription}

## Getting Started

### Prerequisites
- Android Studio Hedgehog or later
- Android SDK 24+

### Run the app
1. Open project in Android Studio
2. Wait for Gradle sync to complete
3. Click Run button or press Shift+F10

### Build APK
\`\`\`bash
./gradlew assembleRelease
\`\`\`
`,
      '.gitignore': `*.iml
.gradle
/local.properties
/.idea
.DS_Store
/build
/captures
.externalNativeBuild
.cxx`
    }
  };
}

module.exports = {
  reactNative,
  flutter,
  swiftIOS,
  kotlinAndroid
};
