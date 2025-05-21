import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
import cv2
import numpy as np

class SyntheticImagePublisher(Node):
    def __init__(self):
        super().__init__('synthetic_image_publisher')
        self.publisher_ = self.create_publisher(Image, 'camera/image_raw', 10)
        self.timer = self.create_timer(0.033, self.timer_callback)  # ~30 FPS
        self.bridge = CvBridge()

        self.frame_height = 480
        self.frame_width = 640
        self.radius = 30
        self.pos_x = 0
        self.direction = 5  # pixels per frame

        self.get_logger().info("Synthetic image publisher started.")

    def timer_callback(self):
        # Create black background
        frame = np.zeros((self.frame_height, self.frame_width, 3), dtype=np.uint8)

        # Draw moving circle
        center = (self.pos_x, self.frame_height // 2)
        cv2.circle(frame, center, self.radius, (0, 255, 0), -1)  # green filled circle

        # Update position
        self.pos_x += self.direction
        if self.pos_x >= self.frame_width - self.radius or self.pos_x <= self.radius:
            self.direction *= -1  # bounce back

        try:
            msg = self.bridge.cv2_to_imgmsg(frame, encoding='bgr8')
            self.publisher_.publish(msg)
        except Exception as e:
            self.get_logger().error(f"Failed to convert or publish frame: {e}")

def main(args=None):
    rclpy.init(args=args)
    print("Starting synthetic image publisher node...")
    node = SyntheticImagePublisher()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
