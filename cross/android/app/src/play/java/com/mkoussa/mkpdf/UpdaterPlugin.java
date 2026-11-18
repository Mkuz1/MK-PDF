package com.mkoussa.mkpdf;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * The Google Play build: Play updates the app, so there is no update check and nothing here downloads or installs
 * anything. Only the "finished" notifications (export, text recognition) remain.
 */
@CapacitorPlugin(name = "Updater")
public class UpdaterPlugin extends Plugin {
    private static final String CHANNEL = "updates";

    @PluginMethod
    public void info(PluginCall call) {
        call.resolve(new JSObject().put("store", true));
    }

    @PluginMethod
    public void install(PluginCall call) {
        call.reject("Updates come from Google Play.");
    }

    @PluginMethod
    public void notify(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(), new String[] { Manifest.permission.POST_NOTIFICATIONS }, 7101);
            call.resolve();
            return;
        }
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(new NotificationChannel(CHANNEL, "Finished tasks", NotificationManager.IMPORTANCE_DEFAULT));
        }
        Intent open = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent tap = PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationCompat.Builder n = new NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(call.getString("title", "MK PDF"))
            .setContentText(call.getString("body", ""))
            .setContentIntent(tap)
            .setAutoCancel(true);
        manager.notify(7100, n.build());
        call.resolve();
    }
}
