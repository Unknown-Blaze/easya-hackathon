import random
import threading
import time
from queue import Queue
from secrets import SystemRandom

from sympy.polys.polyfuncs import interpolate

# from sympy.abc import x

# Configuration
milestone_secret = 10101010101
n = 5  # total nodes
k = 3  # threshold for attestation

# Queue to collect attestations
attestation_queue = Queue()


class ShamirSecretScheme:
    def __init__(self):
        self.rng = SystemRandom()

    def generate_shares(self, secret, num_shares, threshold, prime) -> list((int, int)):
        coefficients = [secret] + [
            self.rng.randint(1, prime - 1) for _ in range(threshold - 1)
        ]

        return [
            (i + 1, sum(c * (i + 1) ** j for j, c in enumerate(coefficients)))
            for i in range(num_shares)
        ]

    def interpolate_secret(self, minimum_shares) -> int:
        secret = interpolate(minimum_shares, 0)
        return secret


def verifier_node(node_id, share, queue):
    """
    Simulates an independent verifier node:
    - Sleeps a random time to simulate processing.
    - 'Attests' by putting its share and timestamp into the queue.
    """
    # Simulate variable verification time
    time.sleep(random.uniform(0.1, 3.0))

    # Simulate timestamp (Unix time)
    timestamp = time.time()
    queue.put((node_id, share, timestamp))
    print(
        f"Node {node_id} attested at {time.strftime('%X', time.localtime(timestamp))}"
    )


threads = []
shamir = ShamirSecretScheme()
shares = shamir.generate_shares(10101010101, n, k, 101)
print(shares)
for i, share in enumerate(shares, start=1):
    t = threading.Thread(target=verifier_node, args=(i, share, attestation_queue))
    t.start()
    threads.append(t)

collected_shares = []
collected_ids = set()

while len(collected_shares) < k:
    node_id, share, timestamp = attestation_queue.get()
    if node_id not in collected_ids:
        collected_ids.add(node_id)
        collected_shares.append(share)

for t in threads:
    t.join()

recovered = shamir.interpolate_secret(collected_shares[:k])

if recovered == milestone_secret:
    print("Milestone attestation successful, escrow can be released.")
else:
    print("Attestation failed: reconstructed secret mismatch.")
