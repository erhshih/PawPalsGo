#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

// Provides all RCTReactNativeFactoryDelegate defaults (JS runtime, root view, etc.)
// AppDelegate cannot extend RCTDefaultReactNativeFactoryDelegate directly because
// it must extend EXAppDelegateWrapper for Expo subscriber support.
@interface PawPalsReactDelegate : RCTDefaultReactNativeFactoryDelegate
@end

@implementation PawPalsReactDelegate

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

@end

// Use ivars instead of @property to avoid ObjC synthesis conflicts
// with EXAppDelegateWrapper's readonly 'reactDelegate' property.
@interface AppDelegate () {
  PawPalsReactDelegate *_rnDelegate;
  RCTReactNativeFactory *_rnFactory;
}
@end

@implementation AppDelegate

@synthesize window = _window;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"main";
  self.initialProps = @{};

  // Run Expo subscriber chain (FileSystem, Linking, ExpoHead, etc.)
  [super application:application didFinishLaunchingWithOptions:launchOptions];

  // Expo SDK 54: EXAppDelegateWrapper no longer extends RCTAppDelegate,
  // so [super application:...] no longer initializes React Native.
  // PawPalsReactDelegate (extends RCTDefaultReactNativeFactoryDelegate)
  // provides all required factory delegate implementations.
  _rnDelegate = [PawPalsReactDelegate new];
  _rnDelegate.dependencyProvider = [RCTAppDependencyProvider new];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  _rnFactory = [[RCTReactNativeFactory alloc] initWithDelegate:_rnDelegate];
  [_rnFactory startReactNativeWithModuleName:@"main"
                                    inWindow:self.window
                               launchOptions:launchOptions];

  return YES;
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || result;
}

// Remote notification delegates for third-party library compatibility
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  return [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  return [super application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  return [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

@end
