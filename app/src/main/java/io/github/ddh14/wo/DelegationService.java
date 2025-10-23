package io.github.ddh14.wo;

// Minimal DelegationService stub - no extra command handlers
import android.content.Intent;
import androidx.annotation.Nullable;

public class DelegationService extends com.google.androidbrowserhelper.trusted.DelegationService {
    @Override
    public void onCreate() {
        super.onCreate();
        // No extra command handlers registered
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return super.onStartCommand(intent, flags, startId);
    }
}