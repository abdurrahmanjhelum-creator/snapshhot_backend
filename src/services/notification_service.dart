import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  NotificationService._();

  static final NotificationService instance = NotificationService._();

  static String? currentUserId;

  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  static void setCurrentUserId(String? userId) {
    currentUserId = userId;
  }

  static String buildAlertMessage(String senderName, String type) {
    final safeSender = senderName.trim().isEmpty ? 'Someone' : senderName.trim();

    switch (type) {
      case 'like':
        return '$safeSender liked your post';
      case 'comment':
        return '$safeSender commented on your post';
      case 'post':
        return '$safeSender shared a new post';
      default:
        return '$safeSender interacted with your post';
    }
  }

  static bool shouldTriggerLocalAlert({
    required String? currentUserId,
    required String? recipientId,
  }) {
    if (currentUserId == null || recipientId == null) return false;
    return currentUserId == recipientId;
  }

  Future<void> initialize() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initializationSettings = InitializationSettings(android: androidSettings);

    await _notificationsPlugin.initialize(settings: initializationSettings);

    final androidPlugin = _notificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();

    await androidPlugin?.createNotificationChannel(
      const AndroidNotificationChannel(
        'socialsnap_notifications',
        'SocialSnap Notifications',
        description: 'Alerts for likes, comments and new posts',
        importance: Importance.max,
        playSound: true,
        enableVibration: true,
      ),
    );
  }

  Future<void> showNotification({
    required int id,
    required String title,
    required String body,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      'socialsnap_notifications',
      'SocialSnap Notifications',
      channelDescription: 'Notification channel for app alerts',
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
      ticker: 'SocialSnap notification',
      enableVibration: true,
      visibility: NotificationVisibility.public,
    );

    const iosDetails = DarwinNotificationDetails();

    final notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notificationsPlugin.show(
      id: id,
      title: title,
      body: body,
      payload: 'socialsnap_notification',
      notificationDetails: notificationDetails,
    );
  }

  Future<void> triggerInteractionAlert({
    required String senderName,
    required String type,
    String? recipientId,
  }) async {
    final shouldTrigger = shouldTriggerLocalAlert(
      currentUserId: NotificationService.currentUserId,
      recipientId: recipientId ?? NotificationService.currentUserId,
    );

    if (!shouldTrigger) return;

    final message = buildAlertMessage(senderName, type);

    await showNotification(
      id: DateTime.now().millisecondsSinceEpoch % 100000,
      title: 'New notification',
      body: message,
    );
  }

  Future<void> showLikeOrCommentAlert({
    required String senderName,
    required String type,
    String? recipientId,
  }) async {
    await triggerInteractionAlert(
      senderName: senderName,
      type: type,
      recipientId: recipientId,
    );
  }
}
