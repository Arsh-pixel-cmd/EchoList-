# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin

# General
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
