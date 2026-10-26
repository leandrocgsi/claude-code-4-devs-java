package br.com.erudio.file;

import java.util.Optional;

public final class ImageTypeDetector {

    private static final int MINIMUM_LENGTH = 12;

    private ImageTypeDetector() {}

    public static Optional<String> detect(byte[] bytes) {
        if (bytes == null || bytes.length < MINIMUM_LENGTH) return Optional.empty();
        if (matches(bytes, 0, 0xFF, 0xD8, 0xFF)) return Optional.of("image/jpeg");
        if (matches(bytes, 0, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) return Optional.of("image/png");
        if (isGif(bytes)) return Optional.of("image/gif");
        if (matches(bytes, 0, 'R', 'I', 'F', 'F') && matches(bytes, 8, 'W', 'E', 'B', 'P')) return Optional.of("image/webp");
        return Optional.empty();
    }

    private static boolean isGif(byte[] bytes) {
        return matches(bytes, 0, 'G', 'I', 'F', '8') &&
                (bytes[4] == '7' || bytes[4] == '9') &&
                bytes[5] == 'a';
    }

    private static boolean matches(byte[] bytes, int offset, int... expected) {
        for (int i = 0; i < expected.length; i++) {
            if ((bytes[offset + i] & 0xFF) != expected[i]) return false;
        }
        return true;
    }
}
