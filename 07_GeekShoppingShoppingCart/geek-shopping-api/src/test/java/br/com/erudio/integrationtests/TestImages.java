package br.com.erudio.integrationtests;

import java.util.Arrays;

public final class TestImages {

    public static final int MAX_IMAGE_BYTES = 5 * 1024 * 1024;

    private TestImages() {}

    public static byte[] jpeg(int size) {
        return withSignature(size, 0xFF, 0xD8, 0xFF, 0xE0);
    }

    public static byte[] png(int size) {
        return withSignature(size, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
    }

    public static byte[] gif(int size) {
        return withSignature(size, 'G', 'I', 'F', '8', '9', 'a');
    }

    public static byte[] webp(int size) {
        return withSignature(size, 'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P');
    }

    public static byte[] pdf(int size) {
        return withSignature(size, '%', 'P', 'D', 'F', '-', '1', '.', '7');
    }

    public static byte[] text(int size) {
        return withSignature(size, 'h', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd', '!');
    }

    private static byte[] withSignature(int size, int... signature) {
        var bytes = new byte[Math.max(size, signature.length)];
        Arrays.fill(bytes, (byte) 0x2A);
        for (int i = 0; i < signature.length; i++) {
            bytes[i] = (byte) signature[i];
        }
        return bytes;
    }
}
