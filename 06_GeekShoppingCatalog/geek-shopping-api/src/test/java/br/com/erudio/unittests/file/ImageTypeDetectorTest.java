package br.com.erudio.unittests.file;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;

import br.com.erudio.file.ImageTypeDetector;

class ImageTypeDetectorTest {

    private static byte[] padded(byte[] header) {
        var bytes = new byte[32];
        System.arraycopy(header, 0, bytes, 0, header.length);
        return bytes;
    }

    private static byte[] ascii(String text) {
        return padded(text.getBytes(StandardCharsets.US_ASCII));
    }

    static Stream<Arguments> acceptedImages() {
        var jpeg = padded(new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0});
        var png = padded(new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});
        var webp = ascii("RIFF\0\0\0\0WEBP");
        return Stream.of(
                Arguments.of("JPEG", jpeg, "image/jpeg"),
                Arguments.of("PNG", png, "image/png"),
                Arguments.of("GIF87a", ascii("GIF87a"), "image/gif"),
                Arguments.of("GIF89a", ascii("GIF89a"), "image/gif"),
                Arguments.of("WebP", webp, "image/webp"));
    }

    static Stream<Arguments> rejectedImages() {
        return Stream.of(
                Arguments.of("plain text", ascii("This is not an image at all")),
                Arguments.of("PDF", ascii("%PDF-1.7")),
                Arguments.of("RIFF that is not WebP", ascii("RIFF\0\0\0\0WAVE")),
                Arguments.of("GIF with an unknown version", ascii("GIF88a")),
                Arguments.of("GIF with a wrong suffix", ascii("GIF89b")),
                Arguments.of("PNG with a truncated signature", padded(new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47})),
                Arguments.of("shorter than the minimum length", new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}),
                Arguments.of("empty", new byte[0]));
    }

    @ParameterizedTest(name = "RN-4 detects {0} by the content")
    @MethodSource("acceptedImages")
    void detectsAcceptedTypesByContent(String label, byte[] bytes, String expected) {
        assertEquals(Optional.of(expected), ImageTypeDetector.detect(bytes));
    }

    @ParameterizedTest(name = "RN-4 rejects {0}")
    @MethodSource("rejectedImages")
    void rejectsContentThatIsNotAnAcceptedImage(String label, byte[] bytes) {
        assertTrue(ImageTypeDetector.detect(bytes).isEmpty());
    }

    @ParameterizedTest
    @NullSource
    void rejectsNull(byte[] bytes) {
        assertTrue(ImageTypeDetector.detect(bytes).isEmpty());
    }

    @Test
    void decidesByTheContentAndNotByTheDeclaredName() {
        var textNamedLikeAnImage = ascii("<html>logo.png</html>");

        assertTrue(ImageTypeDetector.detect(textNamedLikeAnImage).isEmpty());
    }
}
